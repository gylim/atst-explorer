import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import {
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
  useNetwork
} from 'wagmi'
import Papa from 'papaparse'
import { AttestationStationAddress } from '../../constants/addresses'
import AttestationStationABI from '../../constants/abi.json'

import { AttestForm, FormRow, FormLabel } from '../StyledFormComponents'
import Tooltip from '../Tooltip'
import { H2, Body18 } from '../OPStyledTypography'
import { TextInput } from '../OPStyledTextInput'
import { PrimaryButton } from '../OPStyledButton'
import { Select } from '../OPStyledSelect'
import { FileInput } from '../OPStyledFileInput'

const AttestationTypeSelect = styled(Select)`
  color: ${props => (props.value === 'default' ? '#8496AE' : 'inherit')}
`

const FormButton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 28px 0px 0px;
  width: 672px;
`

const HashedKey = styled.textarea`
  align-items: center;
  border: 1px solid #cbd5e0;
  border-radius: 12px;
  box-sizing: border-box;
  font-size: 14px;
  margin: 8px 0;
  outline-style: none;
  padding: 9px 12px;
  height: 48px;
  width: 456px;
  resize:none;
`

const Link = styled.a`
  color: #f01a37;
`

const FeedbackMessage = styled.span`
  padding: 0px 36px;
`

const NewAttestation = () => {
  const { chain } = useNetwork()
  const [etherscanBaseLink, setEtherscanBaseLink] = useState('')

  const [attestationType, setAttestationType] = useState('default')

  const [about, setAbout] = useState('')
  const [key, setKey] = useState('')
  const [hashedKey, setHashedKey] = useState('')
  const [val, setVal] = useState('')
  const [attestation, setAttestation] = useState({
    about,
    key,
    val
  })
  const [file, setFile] = useState(null)
  const [CSVData, setCSVData] = useState()

  const [isAboutValid, setIsAboutValid] = useState(false)
  const [isKeyValid, setIsKeyValid] = useState(false)
  const [isValValid, setIsValValid] = useState(false)

  const {
    config,
    error: prepareError,
    isError: isPrepareError
  } = usePrepareContractWrite({
    address: AttestationStationAddress,
    abi: AttestationStationABI,
    functionName: 'attest',
    args: [
      [attestation]
    ],
    enabled: Boolean(about) && Boolean(key) && Boolean(val)
  })
  const { data, error, isError, write } = useContractWrite(config)

  useEffect(() => {
    try {
      if (chain.name === 'Optimism') {
        setEtherscanBaseLink('https://optimistic.etherscan.io/tx/')
      }
      if (chain.name === 'Optimism Goerli') {
        setEtherscanBaseLink('https://goerli-optimism.etherscan.io/tx/')
      }
    } catch (e) {
      console.error(e)
    }
  }, [chain])

  useEffect(() => {
    try {
      let attest
      if (key.length > 31) {
        attest = {
          about,
          key: hashedKey,
          val: ethers.utils.toUtf8Bytes(val === '' ? '0x' : val)
        }
      } else {
        attest = {
          about,
          key: ethers.utils.formatBytes32String(key === '' ? '0x' : key),
          val: ethers.utils.toUtf8Bytes(val === '' ? '0x' : val)
        }
      }
      setAttestation(attest)
    } catch (e) {
      console.error(e)
    }
    setIsAboutValid(ethers.utils.isAddress(about))
    // todo: make this more robust
    setIsKeyValid(key !== '')
    setIsValValid(val !== '')
  }, [about, key, val])

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash
  })

  const parsing = () => {
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (result) => setCSVData(result.data),
        error: (err, _) => console.log(err)
      })
    } else {
      console.log('No file available')
    }
  }

  const printData = () => {
    return CSVData ? <Body18>{JSON.stringify(CSVData)}</Body18> : <Body18>No File Loaded</Body18>
  }

  return (
    <>
      <H2>New attestation</H2>
      <AttestForm
        onSubmit={(e) => {
          e.preventDefault()
          write?.()
        }}
      >
        <FormRow>
          <FormLabel>Attestation type</FormLabel>
          <AttestationTypeSelect
            value={attestationType}
            onChange={(e) => setAttestationType(e.target.value)}
          >
            <option value="default" hidden>Select attestation type</option>
            <option value="single">Single attestation</option>
            <option value="multi">Batch attestation</option>
            <option value="soon" disabled>More schemas coming soon</option>
          </AttestationTypeSelect>
        </FormRow>
        {attestationType === 'single'
          ? <>
            <FormRow>
              <FormLabel>
                Ethereum address
              </FormLabel>
              <TextInput
                type="text"
                placeholder="Who's this attestation about?"
                onChange={(e) => setAbout(e.target.value)}
                value={about}
                valid={isAboutValid}
              />
            </FormRow>

            <FormRow>
              <FormLabel>
                Attestation key&nbsp;
                <Tooltip>
                  <ul>
                    <li>
                      The key describes what the attestation is about.
                    </li>
                    <li>
                      Example: sbvegan.interface.used:bool
                    </li>
                  </ul>
                </Tooltip>
              </FormLabel>
              <TextInput
                type="text"
                onChange={(e) => {
                  const key = e.target.value
                  if (key.length > 31) {
                    setKey(key)
                    const bytesLikeKey = ethers.utils.toUtf8Bytes(key)
                    const keccak256HashedKey = ethers.utils.keccak256(bytesLikeKey)
                    setHashedKey(keccak256HashedKey)
                  } else {
                    setKey(key)
                    setHashedKey('')
                  }
                }}
                placeholder="Attestation key"
                value={key}
                valid={isKeyValid}
              />
            </FormRow>

            {key.length > 31
              ? <FormRow>
                  <FormLabel>
                    Hashed key&nbsp;
                    <Tooltip>
                      <ul>
                        <li>
                          The key in the smart contract is limited to 32 bytes.
                        </li>
                        <li>
                          When a key is 32 characters or longer, it is hashed with
                          keccack256 to fit in the 32 bytes, and this is the result.
                        </li>
                        <li>
                          This will be the key recorded and used for the AttestationStation.
                        </li>
                      </ul>
                    </Tooltip>
                  </FormLabel>
                  <HashedKey
                    type="text"
                    readOnly
                    value={hashedKey}
                    />
                </FormRow>
              : <span></span>
            }
            <FormRow>
              <FormLabel>
                Attestation value&nbsp;
                <Tooltip>
                  <ul>
                    <li>
                      The value that is associated with the key.
                    </li>
                    <li>
                      Example: true
                    </li>
                  </ul>
                </Tooltip>
              </FormLabel>
              <TextInput
                type="text"
                placeholder="Attestation value"
                onChange={(e) => setVal(e.target.value)}
                value={val}
                valid={isValValid}
              />
            </FormRow>
            <FormButton>
              <PrimaryButton disabled={!write || isLoading || !(isAboutValid && isKeyValid && isValValid)}>
                {isLoading ? 'Making attestion' : 'Make attestation'}
              </PrimaryButton>
            </FormButton>
            {isSuccess && (
              <FeedbackMessage>
                Successfully made attestation:&nbsp;
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${etherscanBaseLink}${data?.hash}`}>
                    etherscan transaction
                </Link>
              </FeedbackMessage>
            )}
          </>
          : <></>}
        {attestationType === 'multi'
          ? <>
            <FormRow>
              <FormLabel>
                Attestation Data&nbsp;
                <Tooltip>
                  <ul>
                    <li>
                      Upload a file with a table of attestation data
                    </li>
                    <li>
                      First column is about, second column is key, third column is value.
                    </li>
                  </ul>
                </Tooltip>
              </FormLabel>
              <FileInput type='file' onChange={(e) => setFile(e.target.files[0])}/>
            </FormRow>
            <FormRow>
              <PrimaryButton type='button' onClick={parsing}>Parse CSV</PrimaryButton>
            </FormRow>

            {printData()}

            <FormButton>
              <PrimaryButton disabled={!write || isLoading || !(isAboutValid && isKeyValid && isValValid)}>
                {isLoading ? 'Making attestion' : 'Make attestation'}
              </PrimaryButton>
            </FormButton>
            {isSuccess && (
              <FeedbackMessage>
                Successfully made attestation:&nbsp;
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${etherscanBaseLink}${data?.hash}`}>
                    etherscan transaction
                </Link>
              </FeedbackMessage>
            )}
          </>
          : <></>}
        {(isPrepareError || isError) && (
          <FeedbackMessage>
              Error: {(prepareError || error)?.message}
          </FeedbackMessage>
        )}
      </AttestForm>
    </>
  )
}

export default NewAttestation
