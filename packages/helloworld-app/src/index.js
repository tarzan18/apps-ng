import React, { useEffect, useState, useMemo } from 'react'
import styled from "styled-components"
import { observer } from 'mobx-react'
import { Button, Input, Spacer, useInput, useToasts } from '@zeit-ui/react'
import { Plus as PlusIcon } from '@zeit-ui/react-icons'

import { useStore } from "@/store"
import Container from '@/components/Container'
import UnlockRequired from '@/components/accounts/UnlockRequired'
import PushCommandButton from '@/components/PushCommandButton'

import { CONTRACT_HELLOWORLD, createHelloWorldAppStore } from './utils/AppStore'
import { reaction } from 'mobx'

const ButtonWrapper = styled.div`
  margin-top: 5px;
  width: 200px;
`;

/**
 * Header of the HelloWorld app page
 */
const AppHeader = () => (
  <Container>
    <h1>Hello Phala World !!! by tarzan18</h1>
    <h3>Hackathon Hello World! by Polkadot</h3>
    <h2>Multiply 2 Numbers And Add it to Multiply Counter</h2>
  </Container>
)

/**
 * Body of the HelloWorld app page
 */
const AppBody = observer(() => {
  const { appRuntime, helloworldApp } = useStore();
  const [, setToast] = useToasts()
  const { state: inc, bindings } = useInput('100')
  const { state:inc2, binding } = useInput('5')

  /**
   * Updates the counter by querying the helloworld contract
   * The type definitions of `GetCount` request and response can be found at contract/helloworld.rs
   */
  async function updateCounter () {
    if (!helloworldApp) return
    try {
      const response = await helloworldApp.queryCounter(appRuntime)
      // Print the response in the original to the console
      console.log('Response::GetCount', response);

      helloworldApp.setCounter(response.GetCount.count)
    } catch (err) {
      setToast(err.message, 'error')
    }
  }

  /**
   * The `increment` transaction payload object
   * It follows the command type definition of the contract (at contract/helloworld.rs)
   */
  const incrementCommandPayload = useMemo(() => {
    const num = parseInt(inc)
    if (isNaN(num) || inc <= 0) {
      return undefined
    } else {
      return {
        Increment: {
          value: num
        }
      }
    }
  }, [inc])

  const incrementCommandPayload2 = useMemo(() => {
    const num = parseInt(inc2)
    if (isNaN(num) || inc2 <= 0) {
      return undefined
    } else {
      return {
        Increment: {
          value: num
        }
      }
    }
  }, [inc2])


  return (
    <Container>
      <section>
        <div>PRuntime: {appRuntime ? 'yes' : 'no'}</div>
        <div>PRuntime ping: {appRuntime.latency || '+∞'}</div>
        <div>PRuntime connected: {appRuntime?.channelReady ? 'yes' : 'no'}</div>
      </section>
      <Spacer y={1}/>

      <h3>Counter</h3>
      <section>
        <div>Counter: {helloworldApp.counter === null ? 'unknown' : helloworldApp.counter}</div>
        <div><Button onClick={updateCounter}>Update</Button></div>
      </section>
      <Spacer y={1}/>

      <h3>Multiply 2 Numbers</h3>
      <section>
        <div>
          <Input label="First Number" {...bindings} />
        </div>
	<div> 
	  <Input label="Second Number" {...binding}/>
	</div>

        <ButtonWrapper>
          {/**  
            * PushCommandButton is the easy way to send confidential contract txs.
            * Below it's configurated to send HelloWorld::Increment()
            */}
          <PushCommandButton
              // tx arguments
              contractId={CONTRACT_HELLOWORLD}
              payload={incrementCommandPayload}
	      payload={incrementCommandPayload2}
              // display messages
              modalTitle='ARE YOU SURE TO SUBMIT WORK???'
              modalSubtitle={`WORK =  ${inc} MULTIPLY BY  ${inc2}`}
              onSuccessMsg='Tx succeeded'
              // button appearance
              buttonType='secondaryLight'
              icon={PlusIcon}
              name='Send'
            />
        </ButtonWrapper>
      </section>

    </Container>
  )
})

/**
 * Injects the mobx store to the global state once initialized
 */
const StoreInjector = observer(({ children }) => {
  const appStore = useStore()
  const [shouldRenderContent, setShouldRenderContent] = useState(false)

  useEffect(() => {
    if (!appStore || !appStore.appRuntime) return
    if (typeof appStore.hellowrldApp !== 'undefined') return
    appStore.helloworldApp = createHelloWorldAppStore({})
  }, [appStore])

  useEffect(() => reaction(
    () => appStore.helloworldApp,
    () => {
      if (appStore.helloworldApp && !shouldRenderContent) {
        setShouldRenderContent(true)
      }
    },
    { fireImmediately: true })
  )

  return shouldRenderContent && children;
})

export default () => (
  <UnlockRequired>
    <StoreInjector>
      <AppHeader />
      <AppBody />
    </StoreInjector>
  </UnlockRequired>
)
