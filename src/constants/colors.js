import { Dimensions } from 'react-native'
//safe area
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')
export default {
    // placeHolder: '#9f7676',
    placeHolder: 'rgba(117,113,154,2)',
    buttonColor: '#d3a3f9',
    textColor: '#3f016e',
    textInputBg: 'rgba(197,198,186,1)',
    mediumTint: 'rgba(107,0,188,1)',
    lightTint: 'rgba(177,77,255,1)',
    evenLighterTint: 'rgba(193,113,255,1)',
    buttonPurple: 'rgba(155,97,234,1)',
    buttonPink: 'rgba(252,140,250,1)',
    buttonPinkTransparent: 'rgba(252,140,250,.28)',
    pinkLESSTransparent: 'rgba(252,180,250,.70)',
    bottomBorderTint: 'rgba(177,77,255,1)',
    transparentModal: 'rgba(0,0,0,0.43)',
    yellow: 'rgba(255, 237, 187, 5)',
    blue: 'rgba(150, 227, 255, 1)',
    blue2: 'rgba(72,150,239,1)',
    blue3: 'rgba(67,97,238,1)',
    blue4: 'rgba(1,53,139,1)',
    pinkUnderLine: '#e896be',
    separatorLine: 'rgba(224,224,224,1)',

  //biyoura purple
  biyouraPurple: 'rgba(67, 0, 138, 1)',

  // new pallet
  nPButton: 'rgba(245, 97, 139, 1)',
  darkestColorP1: '#1A1B1E',
  darkColorP1: 'rgba(42,44,58,1)',
  lightestColorP1: 'rgba(146, 136, 153, 1)',
  backgroundBlurLight: 'rgba(145, 145, 145, 0.6)',

  // new pallet 2
  mainColorP2: 'rgba(107,126,225,2)',
  borderRadius: 16,
  maxFontSizeMultiplier: 1.2,
  screenHeight: height,
  screenWidth: width,
  rowHeight: (width * 16) / 15,

  androidFont: 'open-sans',
  androidFontBold: 'open-sans-bold',
}
