import { AccountType, NetworkAccount, WrappedEVMAccount, InternalAccount } from './shardeumTypes'
import { isWrappedEVMAccount, isInternalAccount } from './wrappedEVMAccountFunctions'

import { ShardeumFlags } from './shardeumFlags'

/**
 * This will correctly get a shardus address from a WrappedEVMAccount account no matter what type it is.
 * This is preferred over toShardusAddress in any case where we have an WrappedEVMAccount
 * maybe this should live in wrappedEVMAccountFunctions?
 * @param account
 * @returns
 */
export function getAccountShardusAddress(account: WrappedEVMAccount | InternalAccount): string {
    if (isWrappedEVMAccount(account)) {
        const addressSource = account.ethAddress
        if (account.accountType === AccountType.ContractStorage) {
            //addressSource = account.key
            const shardusAddress = toShardusAddressWithKey(
                account.ethAddress,
                account.key,
                account.accountType
            )
            return shardusAddress
        }
        if (account.accountType === AccountType.ContractCode) {
            //in this case ethAddress is the code hash which is what we want for the key
            //account.codeHash.toString('hex')
            const shardusAddress = toShardusAddressWithKey(
                account.contractAddress,
                account.ethAddress,
                account.accountType
            )
            return shardusAddress
        }
        if (
            account.accountType === AccountType.Receipt ||
            account.accountType === AccountType.StakeReceipt ||
            account.accountType === AccountType.UnstakeReceipt
        ) {
            //We use the whole eth address for the receipt (non siloed)
            const shardusAddress = toShardusAddress(addressSource, account.accountType)
            return shardusAddress
        }
        if (account.accountType === AccountType.NodeRewardReceipt) {
            return account.ethAddress
        }
        const shardusAddress = toShardusAddress(addressSource, account.accountType)
        return shardusAddress
    } else if (isInternalAccount(account)) {
        if (
            account.accountType === AccountType.NetworkAccount ||
            account.accountType === AccountType.NodeAccount ||
            account.accountType === AccountType.NodeAccount2 ||
            account.accountType === AccountType.DevAccount
        ) {
            return (account as unknown as NetworkAccount).id
        }
    }
}

export function toShardusAddressWithKey(
  addressStr: string,
  secondaryAddressStr: string,
  accountType: AccountType
): string {
  if (accountType === AccountType.Account) {
    if (addressStr.length != 42) {
      throw new Error('must pass in a 42 character hex addressStr for AccountType.Account type.')
    }

    //change this:0x665eab3be2472e83e3100b4233952a16eed20c76
    //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
    return addressStr.slice(2).toLowerCase() + '0'.repeat(24)
  }

  if (
    accountType === AccountType.Receipt ||
    accountType === AccountType.StakeReceipt ||
    accountType === AccountType.UnstakeReceipt
  ) {
    if (addressStr.length === 66) {
      return addressStr.slice(2).toLowerCase()
    } else {
      throw new Error('must pass in a 64 character hex addressStr AccountType.Receipt')
    }
  }

  if (
    ShardeumFlags.contractStorageKeySilo &&
    (accountType === AccountType.ContractStorage || accountType === AccountType.ContractCode)
  ) {
    const numPrefixChars = 8
    // remove the 0x and get the first 8 hex characters of the address
    const prefix = addressStr.slice(2, numPrefixChars + 2)

    if (addressStr.length != 42) {
      throw new Error('must pass in a 42 character hex address for Account type.')
    }
    if (secondaryAddressStr.length === 66) {
      secondaryAddressStr = secondaryAddressStr.slice(2)
    }
    //create a suffix with by discarding numPrefixChars from the start of our keyStr
    const suffix = secondaryAddressStr.slice(numPrefixChars)

    //force the address to lower case
    let shardusAddress = prefix + suffix
    shardusAddress = shardusAddress.toLowerCase()
    return shardusAddress
  }

  if (
    ShardeumFlags.contractStorageKeySilo === false &&
    (accountType === AccountType.ContractStorage || accountType === AccountType.ContractCode)
  ) {
    if (secondaryAddressStr.length === 64) {
      //unexpected case but lets allow it
      return secondaryAddressStr.toLowerCase()
    }
    if (secondaryAddressStr.length != 66) {
      throw new Error(
        `must pass in a 66 character 32 byte address for non Account types. use the key for storage and codehash contractbytes ${addressStr.length}`
      )
    }
    return secondaryAddressStr.slice(2).toLowerCase()
  }

  if (
    accountType === AccountType.NetworkAccount ||
    accountType === AccountType.NodeAccount ||
    accountType === AccountType.NodeAccount2 ||
    accountType === AccountType.NodeRewardReceipt ||
    accountType === AccountType.DevAccount
  ) {
    return addressStr.toLowerCase()
  }

  // receipt or contract bytes remain down past here
  if (addressStr.length === 64) {
    //unexpected case but lets allow it
    return addressStr.toLowerCase()
  }

  if (addressStr.length != 66) {
    throw new Error(
      `must pass in a 66 character 32 byte address for non Account types. use the key for storage and codehash contractbytes ${addressStr.length}`
    )
  }

  //so far rest of the accounts are just using the 32 byte eth address for a shardus address minus the "0x"
  //  later this will change so we can keep certain accounts close to their "parents"

  //change this:0x665eab3be2472e83e3100b4233952a16eed20c76111111111111111111111111
  //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
  return addressStr.slice(2).toLowerCase()
}

export function toShardusAddress(addressStr: string, accountType: AccountType): string {
  if (accountType === AccountType.ContractStorage || accountType === AccountType.ContractCode) {
    throw new Error(
      `toShardusAddress does not work anymore with type ContractStorage, use toShardusAddressWithKey instead`
    )
  }

  if (accountType === AccountType.Account || accountType === AccountType.Debug) {
    if (addressStr.length != 42) {
      throw new Error('must pass in a 42 character hex address for Account type.')
    }
    //change this:0x665eab3be2472e83e3100b4233952a16eed20c76
    //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
    return addressStr.slice(2).toLowerCase() + '0'.repeat(24)
  }

  if (
    accountType === AccountType.Receipt ||
    accountType === AccountType.StakeReceipt ||
    accountType === AccountType.UnstakeReceipt
  ) {
    if (addressStr.length === 66) {
      return addressStr.slice(2).toLowerCase()
    } else {
      throw new Error('must pass in a 64 character hex addressStr AccountType.Receipt')
    }
  }

  if (addressStr.length === 64) {
    //unexpected case but lets allow it
    return addressStr.toLowerCase()
  }

  if (addressStr.length != 66) {
    throw new Error(
      `must pass in a 66 character 32 byte address for non Account types. use the key for storage and codehash contractbytes ${addressStr.length}`
    )
  }

  //so far rest of the accounts are just using the 32 byte eth address for a shardus address minus the "0x"
  //  later this will change so we can keep certain accounts close to their "parents"

  //change this:0x665eab3be2472e83e3100b4233952a16eed20c76111111111111111111111111
  //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
  return addressStr.slice(2).toLowerCase()
}
