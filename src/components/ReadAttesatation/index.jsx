import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import styled from 'styled-components'
// import { useContractRead } from 'wagmi'
// import { AttestationStationAddress } from '../../constants/addresses'
// import AttestationStationABI from '../../constants/abi.json'

import { PrimaryButton } from '../OPStyledButton'
import { AttestForm, FormRow, FormLabel } from '../StyledFormComponents'
import { TextInput } from '../OPStyledTextInput'
import { H2 } from '../OPStyledTypography'

const Textarea = styled.textarea`
  align-items: center;
  border: 1px solid #cbd5e0;
  border-radius: 12px;
  box-sizing: border-box;
  font-size: 14px;
  margin: 8px 0;
  outline-style: none;
  padding: 9px 12px;
  width: 456px;
  resize:none;
`

const ReadAttestation = () => {
  const [creator, setCreator] = useState('')
  const [about, setAbout] = useState('')
  const [key, setKey] = useState('')
  const [bytes32Key, setBytes32Key] = useState('')
  const [data, setData] = useState('')

  const [isCreatorValid, setIsCreatorValid] = useState(false)
  const [isAboutValid, setIsAboutValid] = useState(false)
  const [isKeyValid, setIsKeyValid] = useState(false)

  let err

  const options = { method: 'GET', headers: { accept: 'application/json' } }
  const searchAttestURL = 'https://api.n.xyz/api/v1/dapp/attestationstation/Attestations?'
  const apiKey = `apikey=${process.env}`
  const composeURL = () => {
    const temp = [
      creator ? `creator=${creator}` : '',
      about ? `about=${about}` : '',
      bytes32Key ? `key=${bytes32Key}` : ''
    ]
    const num = temp.reduce((acc, cur) => acc + Number(cur.length > 0), 0)
    if (num === 0) return `${searchAttestURL}${apiKey}`
    if (num === 1) return `${searchAttestURL}${temp.join('')}&${apiKey}`
    if (num >= 2) return `${searchAttestURL}${temp.join('&')}&${apiKey}`
  }

  const handleSearch = async () => {
    const response = await fetch(composeURL(), options)
    if (!response.ok) err = response
    const results = await response.json()
    setData(JSON.stringify(results))
  }

  useEffect(() => {
    setIsCreatorValid(ethers.utils.isAddress(creator))
    setIsAboutValid(ethers.utils.isAddress(about))
    setIsKeyValid(key !== '')
  }, [creator, about, key])

  return (
    <>
      <H2>Search attestations</H2>
      <AttestForm>
        <FormRow>
          <FormLabel>Creator&apos;s address</FormLabel>
          <TextInput
            type="text"
            placeholder="Who created this attestation?"
            onChange={(e) => setCreator(e.target.value)}
            value={creator}
            valid={isCreatorValid}
          />
        </FormRow>

        <FormRow>
          <FormLabel>Subject&apos;s address</FormLabel>
          <TextInput
            type="text"
            placeholder="Who's this attestation about?"
            onChange={(e) => setAbout(e.target.value)}
            value={about}
            valid={isAboutValid}
          />
        </FormRow>

        <FormRow>
          <FormLabel>Attestation key</FormLabel>
          <TextInput
            type="text"
            placeholder="Attestation key"
            onChange={(e) => {
              const key = e.target.value
              if (key.length > 31) {
                setKey(key)
                setBytes32Key(key)
              } else {
                setKey(key)
                setBytes32Key(ethers.utils.formatBytes32String(key))
              }
            }}
            value={key}
            valid={isKeyValid}
          />
        </FormRow>
        <PrimaryButton type='button' onClick={handleSearch}>
            Search
        </PrimaryButton>
        {data ? <Textarea>{data}</Textarea> : <></>}

        {(err) && (
          <div>
            <FormLabel>
              Error: {err.status}
              {err.statusText}
            </FormLabel>
          </div>
        )}
      </AttestForm>
    </>
  )
}

export default ReadAttestation
