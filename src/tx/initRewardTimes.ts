import { nestedCountersInstance, Shardus, ShardusTypes } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { hashSignedObj } from '../setup/helpers'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import {
  InitRewardTimes,
  InternalTx,
  InternalTXType,
  isNodeAccount2,
  NodeAccount2,
  WrappedStates,
} from '../shardeum/shardeumTypes'
import * as WrappedEVMAccountFunctions from '../shardeum/wrappedEVMAccountFunctions'
import { sleep } from '../utils'

export async function injectInitRewardTimesTx(shardus, eventData: ShardusTypes.ShardusEvent) {
  let tx = {
    isInternalTx: true,
    internalTXType: InternalTXType.InitRewardTimes,
    nominee: eventData.publicKey,
    nodeActivatedTime: eventData.time,
    timestamp: Date.now(),
  } as InitRewardTimes

  // to make sure that different nodes all submit an equivalent tx that is counted as the same tx,
  // we need to make sure that we have a deterministic timestamp
  const cycleEndTime = eventData.time
  let futureTimestamp = cycleEndTime * 1000
  while (futureTimestamp < Date.now()) {
    futureTimestamp += 30 * 1000
  }
  const waitTime = futureTimestamp - Date.now()
  tx.timestamp = futureTimestamp
  // since we have to pick a future timestamp, we need to wait until it is time to submit the tx
  await sleep(waitTime)

  tx = shardus.signAsNode(tx)
  if (ShardeumFlags.VerboseLogs) {
    const txid = hashSignedObj(tx)
    console.log(`injectInitRewardTimesTx: tx.timestamp: ${tx.timestamp} txid: ${txid}`, tx)
  }

  return await shardus.put(tx)
}

export function validateFields(tx: InitRewardTimes, shardus: Shardus): { success: boolean; reason: string } {
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Validating InitRewardTimesTX fields', tx)
  if (!tx.nominee || tx.nominee === '' || tx.nominee.length !== 64) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateFields InitRewardTimes fail invalid nominee field', tx)
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateFields InitRewardTimes fail invalid nominee field`)
    return { success: false, reason: 'invalid nominee field in setRewardTimes Tx' }
  }
  if (!tx.nodeActivatedTime) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateFields InitRewardTimes fail nodeActivatedTime missing', tx)
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateFields InitRewardTimes fail nodeActivatedTime missing`)
    return { success: false, reason: 'nodeActivatedTime field is not found in setRewardTimes Tx' }
  }
  if (tx.nodeActivatedTime < 0 || tx.nodeActivatedTime > Date.now()) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateFields InitRewardTimes fail nodeActivatedTime is not correct ', tx)
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateFields InitRewardTimes fail nodeActivatedTime is not correct `)
    return { success: false, reason: 'nodeActivatedTime is not correct in setRewardTimes Tx' }
  }
  const isValid = crypto.verifyObj(tx)
  if (!isValid) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateFields InitRewardTimes fail Invalid signature', tx)
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateFields InitRewardTimes fail Invalid signature`)
    return { success: false, reason: 'Invalid signature' }
  }
  const latestCycles = shardus.getLatestCycles(5)
  const nodeActivedCycle = latestCycles.find((cycle) => cycle.activatedPublicKeys.includes(tx.nominee))
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('nodeActivedCycle', nodeActivedCycle)
  if (!nodeActivedCycle) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateFields InitRewardTimes fail !nodeActivedCycle', tx)
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateFields InitRewardTimes fail !nodeActivedCycle`)
    return { success: false, reason: 'The node publicKey is not found in the recently actived nodes!' }
  }
  if (nodeActivedCycle.start !== tx.nodeActivatedTime) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateFields InitRewardTimes fail start !== tx.nodeActivatedTime', tx)
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateFields InitRewardTimes fail start !== tx.nodeActivatedTime`)
    return { success: false, reason: 'The cycle start time and nodeActivatedTime does not match!' }
  }

  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateFields InitRewardTimes success', tx)
  return { success: true, reason: 'valid' }
}

export function validatePreCrackData(tx: InternalTx) {
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Validating InitRewardTimesTX PreCrackData', tx)
}

export function validate(tx: InitRewardTimes, shardus: Shardus): { result: string; reason: string } {
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Validating InitRewardTimesTX', tx)
  const isValid = crypto.verifyObj(tx)
  if (!isValid) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validate InitRewardTimes fail Invalid signature', tx)
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validate InitRewardTimes fail Invalid signature`)
    return { result: 'fail', reason: 'Invalid signature' }
  }
  const latestCycles = shardus.getLatestCycles(5)
  const nodeActivedCycle = latestCycles.find((cycle) => cycle.activatedPublicKeys.includes(tx.nominee))
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('nodeActivedCycle', nodeActivedCycle)
  if (!nodeActivedCycle) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validate InitRewardTimes fail !nodeActivedCycle', tx)
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validate InitRewardTimes fail !nodeActivedCycle`)
    return { result: 'fail', reason: 'The node publicKey is not found in the recently actived nodes!' }
  }
  if (nodeActivedCycle.start !== tx.nodeActivatedTime) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validate InitRewardTimes fail nodeActivedCycle.start !== tx.nodeActivatedTime', tx)
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validate InitRewardTimes fail nodeActivedCycle.start !== tx.nodeActivatedTime`)
    return { result: 'fail', reason: 'The cycle start time and nodeActivatedTime does not match!' }
  }

  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validate InitRewardTimes success', tx)
  return { result: 'pass', reason: 'valid' }
}

export function apply(
  shardus,
  tx: InitRewardTimes,
  txId: string,
  txTimestamp: number,
  wrappedStates: WrappedStates,
  applyResponse: ShardusTypes.ApplyResponse
) {
  let nodeAccount: NodeAccount2
  const acct = wrappedStates[tx.nominee].data
  if (isNodeAccount2(acct)) {
    nodeAccount = acct
  } else throw new Error('tx.nominee is not a NodeAccount2')
  nodeAccount.rewardStartTime = tx.nodeActivatedTime
  nodeAccount.rewardEndTime = 0
  nodeAccount.timestamp = txTimestamp
  if (ShardeumFlags.useAccountWrites) {
    const wrappedAccount: any = nodeAccount // eslint-disable-line @typescript-eslint/no-explicit-any
    const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedAccount)
    shardus.applyResponseAddChangedAccount(
      applyResponse,
      tx.nominee,
      wrappedChangedAccount,
      txId,
      txTimestamp
    )
  }
  /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `Applied InitRewardTimesTX`)
  console.log('Applied InitRewardTimesTX for', tx.nominee)
}
