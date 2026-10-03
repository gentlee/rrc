import {EntitiesMap} from 'rrc'

import {Bank, Typenames, User} from './types'

export const API_TIMEOUT = 300

const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const apiTimeout = () => timeout(API_TIMEOUT)

export const generateUser = (id: number, full = true, nameSuffix = ''): User => {
  const user: User = {
    id,
    bankId: String(id),
  }
  if (full) {
    user.name = `User ${id}` + nameSuffix
  }
  return user
}

export const generateBank = (id: string, nameSuffix = ''): Bank => {
  return {
    id,
    name: 'Bank ' + id + nameSuffix,
  }
}

export const generateTestEntitiesMap = (size: number, full = true): EntitiesMap<Typenames> => {
  const users = Array.from({length: size}, (_, i) => generateUser(i + 1, full))
  const banks = Array.from({length: size}, (_, i) => generateBank(String(i + 1)))

  return {
    users: mapFromArray(users, 'id'),
    banks: mapFromArray(banks, 'id'),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapFromArray = <T extends Record<string, any>, K extends keyof T>(
  array: T[],
  key: K,
): Record<string, T> => {
  return array.reduce(
    (acc, item) => {
      acc[item[key]] = item
      return acc
    },
    {} as Record<string, T>,
  )
}
