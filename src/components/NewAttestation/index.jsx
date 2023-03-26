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

import { AttestForm, FormRow, FormLabel, FormButton } from '../StyledFormComponents'
import Tooltip from '../Tooltip'
import { H2, Body18 } from '../OPStyledTypography'
import { TextInput } from '../OPStyledTextInput'
import { PrimaryButton } from '../OPStyledButton'
import { Select } from '../OPStyledSelect'
import { FileInput } from '../OPStyledFileInput'

const AttestationTypeSelect = styled(Select)`
  color: ${props => (props.value === 'default' ? '#8496AE' : 'inherit')}
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
  const [attestations, setAttestations] = useState([])

  const [isAboutValid, setIsAboutValid] = useState(false)
  const [isKeyValid, setIsKeyValid] = useState(false)
  const [isValValid, setIsValValid] = useState(false)
  const [isAllValid, setIsAllValid] = useState(false)
  const [validateErr, setValidateErr] = useState('')

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
    enabled: (Boolean(about) && Boolean(key) && Boolean(val))
  })
  const { data, error, isError, write } = useContractWrite(config)

  const {
    config: config2,
    error: prepareError2,
    isError: isPrepareError2
  } = usePrepareContractWrite({
    address: AttestationStationAddress,
    abi: AttestationStationABI,
    functionName: 'attest',
    args: [
      attestations
    ],
    enabled: Boolean(attestations.length)
  })
  const { data: data2, error: error2, isError: isError2, write: write2 } = useContractWrite(config2)

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
      const attest = {
        about,
        key: key.length > 31 ? hashedKey : ethers.utils.formatBytes32String(key === '' ? '0x' : key),
        val: ethers.utils.toUtf8Bytes(val === '' ? '0x' : val)
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

  const { isLoading: isLoading2, isSuccess: isSuccess2 } = useWaitForTransaction({ hash: data2?.hash })

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

  const handleKey = (key) => {
    if (key.length < 32) return ethers.utils.formatBytes32String(key === '' ? '0x' : key)
    else return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(key))
  }

  const checkMultiAttest = (attestArray) => {
    if (attestArray) {
      const checkAdd = []
      const checkKey = []
      const checkVal = []
      let outcome = 'Errors detected\n '
      attestArray.forEach((ele, idx) => {
        if (!ethers.utils.isAddress(ele.about)) checkAdd.push(idx)
        if (ele.key === '') checkKey.push(idx)
        if (ele.val === '') checkVal.push(idx)
      })
      if (!checkAdd.length && !checkKey.length && !checkVal.length) {
        setIsAllValid(true)
      } else {
        if (checkAdd.length) outcome += `Please check addresses in rows ${checkAdd.join(', ')}.\n`
        if (checkKey.length) outcome += `Please check keys in rows ${checkKey.join(', ')}.\n`
        if (checkVal.length) outcome += `Please check values in rows ${checkVal.join(', ')}`
        setValidateErr(outcome)
      }
    } else {
      console.log('No attest array detected')
    }
  }

  useEffect(() => {
    const prepareAttestations = () => {
      if (CSVData) {
        const prep = CSVData.map((ele) => {
          const about = ele.about
          return {
            about,
            key: handleKey(ele.key),
            val: ethers.utils.toUtf8Bytes(ele.val === '' ? '0x' : ele.val)
          }
        })
        setAttestations(prep)
      } else {
        console.log('No CSV data')
      }
    }
    prepareAttestations()
    checkMultiAttest(CSVData)
  }, [CSVData])

  const printErr = () => {
    if (CSVData && validateErr) return <Body18>{validateErr}</Body18>
    else if (CSVData && isAllValid) return <Body18>All data checked correct!</Body18>
    else return <></>
  }

  return (
    <>
      <H2>New attestation</H2>
      <AttestForm>
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
                    setHashedKey(handleKey(key))
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
              <PrimaryButton disabled={!write || isLoading || !(isAboutValid && isKeyValid && isValValid)} type='button' onClick={() => write?.()}>
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
            {(isPrepareError || isError) && (
              <FeedbackMessage>
                  Error: {(prepareError || error)?.message}
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
                      First column is <u>about</u>, second column is <u>key</u>, third column is <u>value</u>
                    </li>
                  </ul>
                </Tooltip>
              </FormLabel>
              <FileInput type='file' onChange={(e) => setFile(e.target.files[0])}/>
            </FormRow>
            <FormRow>
              {printErr()}
              <PrimaryButton type='button' onClick={parsing}>Parse CSV</PrimaryButton>
            </FormRow>

            <FormButton>
              <PrimaryButton disabled={!write2 || isLoading2 || !isAllValid} type='button' onClick={() => write2?.()}>
                {isLoading2 ? 'Making Multi-attest' : 'Make Multi-attest'}
              </PrimaryButton>
            </FormButton>
            {isSuccess2 && (
              <FeedbackMessage>
                Successfully made attestation:&nbsp;
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${etherscanBaseLink}${data2?.hash}`}>
                    etherscan transaction
                </Link>
              </FeedbackMessage>
            )}
            {(isPrepareError2 || isError2) && (
              <FeedbackMessage>
                  Error: {(prepareError2 || error2)?.message}
              </FeedbackMessage>
            )}
          </>
          : <></>}
      </AttestForm>
    </>
  )
}

export default NewAttestation
