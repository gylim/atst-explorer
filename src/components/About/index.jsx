import React from 'react'

import styled from 'styled-components'

import { H2, Body16, Body16Bold } from '../OPStyledTypography'

const AboutContainer = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  text-align: left;
  width: 672px;
`

const SubSection = styled(Body16Bold)`
  margin: 0;
`

const Link = styled.a`
  color: #f01a37;
`
const Bold = styled.span`
  font-weight: bold;
`

const AboutAttestations = () => {
  return (
    <AboutContainer>
      <H2>About</H2>
      <SubSection>What&apos;s the AttestationStation?</SubSection>
      <Body16>
        The AttestationStation is an <Bold>attestation smart contract </Bold>
        deployed on Optimism. It enables anyone to make arbitrary attestations
        about other addresses.
      </Body16>

      <SubSection>What&apos;s AttestationStation Explorer?</SubSection>
      <Body16>
        A <Bold>no-code open source solution to explore and make attestations </Bold>
        forked from sbvegan&apos;s implementation of the&nbsp;
        <Link
          target="_blank"
          rel="noopener noreferrer"
          href="https://attestationstation.xyz/"
        >
          AttestationStation Interface
        </Link>.
      </Body16>

      <SubSection>Okay, but why?</SubSection>
      <Body16>
        Ultimately the goal for the AttestationStation is <Bold>to serve as an accessible data
        source for builders creating reputation related apps</Bold>. It can be used for a wide
        variety of applications including voting, reputations, reviews, and more.
      </Body16>

      <SubSection>Learn more</SubSection>
      <Body16>
        <Link
          target="_blank"
          rel="noopener noreferrer"
          href="https://community.optimism.io/docs/governance/attestation-station/#"
        >
            Official Optimism Documentation
        </Link>
      </Body16>
    </AboutContainer>
  )
}

export default AboutAttestations
