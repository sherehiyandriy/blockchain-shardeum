import { Shardus, ShardusTypes, nestedCountersInstance } from '@shardus/core'
import { ValidatorError } from './queryCertificate'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import * as crypto from '@shardus/crypto-utils'
import { Request } from 'express'

export interface AdminCert {
  nominee: string
  certExp: number
  sign: ShardusTypes.Sign
}

export type PutAdminCertRequest = AdminCert

export interface PutAdminCertResult {
  success: boolean
  signedAdminCert: AdminCert
}

function validatePutAdminCertRequest(req: PutAdminCertRequest, shardus: Shardus): ValidatorError {
  const publicKey = shardus.crypto.getPublicKey()

  if (!req.nominee || req.nominee === '' || req.nominee.length !== 64 || req.nominee != publicKey) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-admin-certificate', `validatePutAdminCertRequest fail req.nominee address invalid`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validatePutAdminCertRequest fail req.nominee address invalid', req)
    return { success: false, reason: 'Invalid nominee address' }
  }
  try {
    if (!crypto.verifyObj(req)) return { success: false, reason: 'Invalid signature for AdminCert' }
  } catch (e) {
    return { success: false, reason: 'Invalid signature for QueryCert tx' }
  }
  try {
    if (!shardus.crypto.verify(req, ShardeumFlags.devPublicKey))
      return { success: false, reason: 'Invalid signature for AdminCert' }
  } catch (e) {
    return { success: false, reason: 'Invalid signature for QueryCert tx' }
  }

  return { success: true, reason: '' }
}

export async function putAdminCertificateHandler(
  req: Request,
  shardus: Shardus
): Promise<PutAdminCertResult | ValidatorError> {
  nestedCountersInstance.countEvent('shardeum-admin-certificate', 'calling queryCertificateHandler')

  const certReq = req.body as PutAdminCertRequest
  const reqValidationResult = validatePutAdminCertRequest(certReq, shardus)
  if (!reqValidationResult.success) {
    nestedCountersInstance.countEvent(
      'shardeum-admin-certificate',
      'queryCertificateHandler: failed validateQueryCertRequest'
    )
    return reqValidationResult
  }

  return { success: true, signedAdminCert: certReq }
}
