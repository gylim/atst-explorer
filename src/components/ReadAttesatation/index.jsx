import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Buffer } from 'buffer'
// import styled from 'styled-components'
// import { useContractRead } from 'wagmi'
// import { AttestationStationAddress } from '../../constants/addresses'
// import AttestationStationABI from '../../constants/abi.json'

import { PrimaryButton } from '../OPStyledButton'
import { AttestForm, FormRow, FormLabel } from '../StyledFormComponents'
import { TextInput } from '../OPStyledTextInput'
import { H2, Body14, Body12 } from '../OPStyledTypography'
import { CardBody, CardHeader, CardRow, CardTable } from '../Table'

// const Textarea = styled.textarea`
//   align-items: center;
//   border: 1px solid #cbd5e0;
//   border-radius: 12px;
//   box-sizing: border-box;
//   font-size: 14px;
//   margin: 8px 0;
//   outline-style: none;
//   padding: 9px 12px;
//   width: 456px;
//   resize:none;
// `

const ReadAttestation = () => {
  const [creator, setCreator] = useState('')
  const [about, setAbout] = useState('')
  const [key, setKey] = useState('')
  const [bytes32Key, setBytes32Key] = useState('')
  const [data, setData] = useState()

  const [isCreatorValid, setIsCreatorValid] = useState(false)
  const [isAboutValid, setIsAboutValid] = useState(false)
  const [isKeyValid, setIsKeyValid] = useState(false)

  let err

  const searchAttestURL = 'https://api.n.xyz/api/v1/dapp/attestationstation/Attestations?'
  const apiKey = `apikey=${process.env.REACT_APP_NXYZ_KEY}`
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
    const options = { method: 'GET', headers: { accept: 'application/json' } }
    fetch(composeURL(), options)
      .then(response => response.json())
      .then(response => {
        console.log(...response)
        setData(response)
      })
      .catch(error => (err = error))
  }

  const truncateAdd = (address) => {
    return address.slice(0, 6) + '...' + address.slice(-4)
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
        {data
          ? <CardTable>
          <CardHeader><H2>Results</H2></CardHeader>
          <CardBody>
            {data.map((ele, idx, arr) => (<>
              <CardRow key={ele.transactionHash}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', marginRight: '5rem' }}>
                  <Body12><strong>From:</strong> {truncateAdd(ele.creator)}</Body12>
                  <Body12><strong>About:</strong> {truncateAdd(ele.about)}</Body12>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center' }}>
                  <Body14>{ethers.utils.parseBytes32String(ele.key)}</Body14>
                  <Body14>{Buffer.from(ele.val, 'utf8')}</Body14>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'flex-end', marginLeft: '5rem' }}>
                  <Body12>{ele.createdAtTimestamp.split('T')[0]}</Body12>
                  <Body12>{ele.createdAtTimestamp.split('T')[1].slice(0, -8)}Z</Body12>
                </div>
              </CardRow>
              {idx < arr.length - 1 ? <hr style={{ color: '#ffffff' }}/> : <></>}
            </>))}
          </CardBody>
        </CardTable>
          : <></>}

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
