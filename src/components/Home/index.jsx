import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Flipside } from '@flipsidecrypto/sdk'
import { AttestationStationAddress } from '../../constants/addresses'

import { H2, Body12, Body14, Body16Bold } from '../OPStyledTypography'
import { CardBody, CardRow, CardTable } from '../Table'

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  text-align: left;
  width: 672px;
`

const SubSection = styled(Body16Bold)`
  margin: 0;
`

const Home = () => {
  const [results, setResults] = useState()

  const truncateAdd = (address) => {
    return address.slice(0, 6) + '...' + address.slice(-4)
  }

  const query = {
    sql: `with base as (
                select *,
                regexp_substr_all(SUBSTR(DATA, 3, len(DATA)), '.{64}') AS segmented_data
                from optimism.core.fact_event_logs
                where block_timestamp > '2022-12-14'
                and contract_address = '${AttestationStationAddress}'
                and topics[0]::string = '0x28710dfecab43d1e29e02aa56b2e1e610c0bae19135c9cf7a83a1adb6df96d85'
            )
            , decoded AS (
                select
                block_number,
                block_timestamp,
                tx_hash,
                origin_from_address,
                origin_to_address,
                event_index,
                CONCAT('0x', SUBSTR(topics [1] :: STRING, 27, 40)) AS creator,
                CONCAT('0x', SUBSTR(topics [2] :: STRING, 27, 40)) AS about,
                replace(topics [3] :: STRING,'0x','') as key,
                try_hex_decode_string(key::string) as decoded_key,
                substr(data::string,131,(ethereum.public.udf_hex_to_int(segmented_data[1]::string) * 2)) as val,
                try_hex_decode_string(val::string) as val_text
                from base
            )
            SELECT
                decoded_key, val, val_text, about,
                block_timestamp, creator, tx_hash,
                origin_from_address, origin_to_address
            FROM decoded
            ORDER BY block_timestamp DESC
            LIMIT 10`,
    ttlMinutes: 15
  }

  useEffect(() => {
    const flipside = new Flipside(process.env.REACT_APP_SHROOM_API_KEY, 'https://node-api.flipsidecrypto.com')
    const result = flipside.query.run(query)
    setResults(result)
  }, [])

  return (
        <>
            <HomeContainer>
                <H2>Home</H2>
                <SubSection>Last 10 Attesations</SubSection>
                <CardTable>
                    <CardBody>
                    {results && results.records.map((ele, idx, arr) => (<>
                        <CardRow key={ele.tx_hash}>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', marginRight: '5rem' }}>
                                <Body12><strong>From:</strong> {truncateAdd(ele.creator)}</Body12>
                                <Body12><strong>About:</strong> {truncateAdd(ele.about)}</Body12>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center' }}>
                                <Body14>{ele.decoded_key}</Body14>
                                <Body14>{ele.val_text}</Body14>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'flex-end', marginLeft: '5rem' }}>
                                <Body12>{ele.block_timestamp.split('T')[0]}</Body12>
                                <Body12>{ele.block_timestamp.split('T')[1].slice(0, -8)}Z</Body12>
                            </div>
                        </CardRow>
                        {idx < arr.length - 1 ? <hr style={{ color: '#ffffff' }}/> : <></>}
                    </>))}
                    </CardBody>
                </CardTable>
            </HomeContainer>
        </>
  )
}

export default Home
