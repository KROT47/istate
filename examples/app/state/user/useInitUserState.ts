import { useEffect } from 'react'

import { fetchUserProfile, syncUserSettings, trackSession } from '../../api/client.js'
import { userState } from './userState.js'

export function useInitUserState() {
  useEffect(() => {
    let active = true
    void fetchUserProfile().then((profile) => {
      if (active) userState.userInfo = profile
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return userState.addSync({
      path: 'settings',
      uniqueKeyGetter: () => 'user.settings',
      errorHandler(error) {
        console.error(error)
      },
      sync: (settings) => syncUserSettings(settings),
    })
  }, [])

  useEffect(() => {
    return userState.on('login', ({ userId, isSignUp }) => {
      void trackSession({ userId, isSignUp })
    })
  }, [])

  useEffect(() => {
    return userState.on('logout', (message) => {
      if (message) console.info(message)
    })
  }, [])
}
