export const TAKE_PICTURE = 'TAKE_PICTURE'
export const ADD_TO_GALLERY = 'ADD_TO_GALLERY'
export const SET_CAMERA_UP = 'SET_CAMERA_UP'

import { LINK } from '../../utilities/apiLink'

export const takePicture = (uri, base64) => {
  return {
    type: TAKE_PICTURE,
    pictureUri: uri,
    pictureBase64: base64,
  }
}

export const addToGallery = (photo, galleryID) => {
  console.log('added this shit')
  console.log('added this shit')
  return async (dispatch, getState) => {
    const userID = getState().signupReducer.userInfo.userID
    const body = JSON.stringify({
      userID: userID,
      galleryID,
      photo,
    })
    console.log('🚀 ~ file: actions.js ~ line 21 ~ return ~ body', body)
    try {
      const response = await fetch(`${LINK}&file-upload=1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          key: 'ThisIsASecretKey',
        },
        body: body,
      })

      if (!response.ok) {
        throw new Error('Something went wrong!')
        // OR below you can pass the error status.
        throw new Error(response.status.toString())
      }

      try {
        const data = await response.json()
        console.log('🚀 ~ file: actions.js ~ line 48 ~ return ~ data', data)
      } catch (error) {
        throw error
      }

      dispatch({
        type: ADD_TO_GALLERY,
        picture: photo,
      })
    } catch (error) {
      throw error
    }
  }
}

export const setCameraUp = (imagePadding, ratio, previewRatio) => {
  return {
    type: SET_CAMERA_UP,
    imagePadding,
    ratio,
    previewRatio,
  }
}
