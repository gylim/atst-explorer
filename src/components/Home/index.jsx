import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import styled from 'styled-components'

import { H2, Body12, Body14, Body16Bold } from '../OPStyledTypography'
import { CardBody, CardRow, CardTable } from '../Table'
import Tooltip from '../Tooltip'

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  text-align: left;
  width: 700px;
`

const SubHeading = styled(Body16Bold)`
  margin: 0;
`

const BlockLink = styled.a`
  text-decoration: none;
`

const Home = () => {
  const [results, setResults] = useState()
  const [attested, setAttested] = useState()
  const [creator, setCreator] = useState()

  const recentTxn = async () => {
    const options = { method: 'GET', headers: { accept: 'application/json' } }
    fetch(`https://api.n.xyz/api/v1/dapp/attestationstation/Attestations?apikey=${process.env.REACT_APP_NXYZ_KEY}`, options)
      .then(response => response.json())
      .then(response => {
        setResults(groupArray(response))
      })
      .catch(err => console.error(err))
  }

  const truncateAdd = (address) => {
    return address.slice(0, 6) + '...' + address.slice(-4)
  }

  const hexToAscii = (str) => {
    let output = ''
    for (let n = 0; n < str.length; n += 2) {
      output += String.fromCharCode(parseInt(str.substr(n, 2), 16))
    }
    return output
  }

  const groupArray = (arr) => {
    const ans = []
    for (let i = 0; i < arr.length; i++) {
      const lastIdx = ans.length - 1
      if (lastIdx !== -1 && arr[i].transactionHash === ans[lastIdx].transactionHash) {
        if (typeof ans[lastIdx].key === 'string') {
          ans[lastIdx].key = [ans[lastIdx].key, arr[i].key]
          ans[lastIdx].val = [ans[lastIdx].val, arr[i].val]
        } else {
          ans[lastIdx].key.push(arr[i].key)
          ans[lastIdx].val.push(arr[i].val)
        }
      } else {
        ans.push(arr[i])
      }
    }
    return ans
  }

  const mostAttested = async () => {
    const options = { method: 'GET', headers: { accept: 'application/json' } }
    fetch(`https://api.n.xyz/api/v1/dapp/attestationstation/SubjectStats?apikey=${process.env.REACT_APP_NXYZ_KEY}`, options)
      .then(response => response.json())
      .then(response => {
        setAttested(response.slice(0, 6))
      })
      .catch(err => console.error(err))
  }

  const mostCreated = async () => {
    const options = { method: 'GET', headers: { accept: 'application/json' } }
    fetch(`https://api.n.xyz/api/v1/dapp/attestationstation/CreatorStats?apikey=${process.env.REACT_APP_NXYZ_KEY}`, options)
      .then(response => response.json())
      .then(response => {
        setCreator(response.slice(0, 6))
      })
      .catch(err => console.error(err))
  }

  useEffect(() => {
    recentTxn()
    mostAttested()
    mostCreated()
  }, [])

  return (
        <>
          <HomeContainer>
              <H2>Home</H2>
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around' }}>
                <SubHeading>Most Attested About</SubHeading>
                <SubHeading>Most Prolific Creator</SubHeading>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', marginBottom: '1rem' }}>
                <CardTable>
                  <CardBody>
                    {attested && attested.map((ele, idx) => (
                      <>
                        <CardRow>
                          <div style={{ display: 'flex', flexDirection: 'row' }}>
                            <Body14 style={{ marginRight: '3rem' }}>{idx + 1}.</Body14>
                            <a href={`https://optimistic.etherscan.io/address/${ele.about}`} target='_blank' rel='noopener noreferrer'>
                              <Body14 style={{ marginRight: '3rem' }}>{truncateAdd(ele.about)}</Body14>
                            </a>
                            <Body14><strong>Count:</strong> {ele.attestationCount}</Body14>
                          </div>
                        </CardRow>
                        <hr style={{ color: '#ffffff' }}/>
                      </>
                    ))}
                  </CardBody>
                </CardTable>
                <CardTable>
                  <CardBody>
                    {creator && creator.map((ele, idx) => (
                        <>
                          <CardRow>
                            <div style={{ display: 'flex', flexDirection: 'row' }}>
                              <Body14 style={{ marginRight: '3rem' }}>{idx + 1}.</Body14>
                              <a href={`https://optimistic.etherscan.io/address/${ele.creator}`} target='_blank' rel='noopener noreferrer'>
                                <Body14 style={{ marginRight: '3rem' }}>{truncateAdd(ele.creator)}</Body14>
                              </a>
                              <Body14><strong>Count:</strong> {ele.attestationCount}</Body14>
                            </div>
                          </CardRow>
                          <hr style={{ color: '#ffffff' }}/>
                        </>
                    ))}
                  </CardBody>
                </CardTable>
              </div>
              <SubHeading style={{ margin: 'auto' }}>Latest Attesations</SubHeading>
              <CardTable style={{ margin: 'auto' }}>
                  <CardBody>
                  {results && results.map((ele, idx, arr) => (<BlockLink key={Object.keys(arr)[idx]} href={`https://optimistic.etherscan.io/tx/${ele.transactionHash}`} target='_blank' rel='noopener noreferrer'>
                      <CardRow>
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', marginRight: '5rem' }}>
                              <Body12><strong>From:</strong> {truncateAdd(ele.creator)}</Body12>
                              <Body12><strong>About:</strong> {truncateAdd(ele.about)}</Body12>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center' }}>
                              {typeof ele.key === 'object'
                                ? <Body14>...multi-keys...<Tooltip><ul>
                                {ele.key.map((key, idx, arr) =>
                                  (<li key={Object.keys(arr)[idx]}>{ethers.utils.parseBytes32String(key)}</li>)
                                )}
                                </ul></Tooltip></Body14>
                                : <Body14>{ethers.utils.parseBytes32String(ele.key)}</Body14>}
                              {typeof ele.val === 'object'
                                ? <Body14>...multi-value...<Tooltip><ul>
                                {ele.val.map((val, idx, arr) =>
                                  (<li key={Object.keys(arr)[idx]}>{hexToAscii(val)}</li>)
                                )}
                                </ul></Tooltip></Body14>
                                : <Body14>{hexToAscii(ele.val)}</Body14>}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'flex-end', marginLeft: '5rem' }}>
                              <Body12>{ele.createdAtTimestamp.split('T')[0]}</Body12>
                              <Body12>{ele.createdAtTimestamp.split('T')[1].slice(0, -8)}Z</Body12>
                          </div>
                      </CardRow>
                      {idx < arr.length - 1 ? <hr style={{ color: '#ffffff' }}/> : <></>}
                  </BlockLink>))}
                  </CardBody>
              </CardTable>
          </HomeContainer>
        </>
  )
}

export default Home
