import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ImageBackground,
    Platform,
    Linking,
    Image,
    ActivityIndicator,
} from 'react-native'
//shared elements
import { SharedElement } from 'react-navigation-shared-element'
import { FlatList, PanGestureHandler } from 'react-native-gesture-handler'
import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
    useAnimatedGestureHandler,
    runOnJS,
    Extrapolate,
    interpolate,
    withDelay,
} from 'react-native-reanimated'
import { snapPoint } from 'react-native-redash'

//custom components
import ScreenWrapper from '../components/ScreenWrapper'
import HeaderBasic from '../components/HeaderBasic'
import ThumbnailSmall from '../components/ThumbnailSmall'
import CachedImageGalleryView from '../components/CachedImageGalleryView'
import GalDetailBottomSheet from '../screens/GalDetailBottomSheet'

//hooks
import useDidMountEffect from '../hooks/useDidMountEffect'

//useFocus InteractionManager
import { InteractionManager } from 'react-native'
import { useFocusEffect, useIsFocused } from '@react-navigation/native'

//constants
import colors from '../constants/colors'

//safe area
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')

//ionicons
import { Ionicons } from '@expo/vector-icons'
import { Icon } from 'react-native-elements'

//dummy data
import images from '../data/images'

//redux
import {
    setPics,
    shouldRefreshSet,
    emptyPicsArray,
} from '../store/event/action'

import {
    savePermissionsStatus,
    loadPermissions,
} from '../store/permissions/actions'
import { useDispatch, useSelector } from 'react-redux'

//expo camera
import { Camera } from 'expo-camera'
import { Audio } from 'expo-av'

//fast image
import FastImage from 'react-native-fast-image'

const GalleryView = ({ route, navigation }) => {
    const { galleryID, thumbnail, galName } = route.params

    // shouldRefresh
    const shouldRefresh = useSelector(
        (state) => state.galleryReducer.shouldRefresh
    )

    //insets
    const insets = useSafeAreaInsets()

    //dispatch
    const dispatch = useDispatch()

    //isFocused?
    const isFocused = useIsFocused()

    // pan gesture handler
    // const enable = useSharedValue(false).value
    const [enable, setEnabled] = useState()
    const translateX = useSharedValue(0)
    const translateY = useSharedValue(0)
    const isGestureActive = useSharedValue(false)

    let tabBarBottomPosition = insets.bottom > 0 ? insets.bottom / 2 + 2 : 10

    if (tabBarBottomPosition === 10 && Platform.OS === 'android') {
        tabBarBottomPosition = 55
    }

    const picturePressedHandler = useCallback(
        (image, scrollIndex, picID, fullPathNav) => {
            navigation.navigate('GalleryDetailScreen', {
                image,
                scrollIndex,
                picID,
                fullPathNav,
            })
        },
        []
    )

    //old way of handling gesture event
    const handleScroll = useCallback((event) => {
        if (event.nativeEvent.contentOffset.y <= 0) {
            Platform.OS === 'android' ? navigation.goBack() : null
        }
    }, [])

    //----------------------------------------------------------------PAN ANIMATION LOGIC----------------------------------------------------------------
    const panViewRef = useRef()
    const scrollViewRef = useRef()
    let offset = 0
    const onScroll = useCallback(
        ({ nativeEvent }) => {
            let currentOffset = nativeEvent.contentOffset.y
            let direction = currentOffset > offset ? 'down' : 'up'

            if (
                direction === 'up' &&
                nativeEvent.contentOffset.y <= 0 &&
                !enable
            ) {
                console.log('enabled!')
                setEnabled(true)
            }
            if (
                direction === 'down' &&
                nativeEvent.contentOffset.y > 0 &&
                enable
            ) {
                console.log('disabled!')
                setEnabled(false)
            }
        },
        [setEnabled, enable]
    )

    const timeToClose = useCallback(() => {
        navigation.goBack()
        dispatch(emptyPicsArray())
    }, [])

    function closePage() {
        'worklet'
        runOnJS(timeToClose)()
    }

    const reEnableFlatList = useCallback(() => {
        setEnabled((prev) => !prev)
    }, [enable])

    function enableScroll() {
        'worklet'
        runOnJS(reEnableFlatList)()
    }

    const onGestureEvent = useAnimatedGestureHandler({
        onStart: ({ translationY }) => {
            if (!enable) return
            isGestureActive.value = true
        },
        onActive: ({ translationX, translationY }) => {
            if (!enable) return
            translateY.value = translationY
            translateX.value = translationX
        },
        onEnd: ({ velocityX, velocityY }) => {
            if (!enable) return
            const goBack =
                snapPoint(translateY.value, velocityY, [
                    0,
                    height - height / 2,
                ]) ===
                height - height / 2
            if (goBack) {
                closePage()
            } else {
                enableScroll()
                translateX.value = withTiming(0, { duration: 100 })
                translateY.value = withTiming(0, { duration: 100 })
            }
            isGestureActive.value = false
        },
    })
    const panGestureStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            translateY.value,
            [0, height],
            [1, 0.62],
            Extrapolate.CLAMP
        )
        return {
            flex: 1,
            borderRadius: withTiming(isGestureActive.value ? 30 : 0, {
                duration: 200,
            }),
            transform: [
                {
                    /* this is multiplied by scale because that keeps
                    the finger position in mind while panning around the view */
                    translateX: translateX.value * scale,
                },
                {
                    translateY: translateY.value * scale,
                },
                {
                    scale,
                },
            ],
        }
    })
    //----------------------------------------------------------------PAN ANIMATION LOGIC----------------------------------------------------------------

    //----------------------------------------------------------------LOAD PICS--------------------------------------------------------
    const pics = useSelector((state) => state.galleryReducer.pics)

    const [loadingPics, setLoadingPics] = useState()

    const loadingOpacity = useSharedValue(1)
    const opacityStyle = useAnimatedStyle(() => {
        return {
            opacity: loadingOpacity.value,
        }
    })
    const startOpacityAnim = useCallback(() => {
        loadingOpacity.value = withTiming(0, { duration: 0 })
    }, [])

    const loadPics = useCallback(async () => {
        loadingOpacity.value = 1
        try {
            await dispatch(setPics(galleryID))
        } catch (error) {}
        startOpacityAnim()
    }, [])

    useFocusEffect(() => {
        const refreshConditionally = async () => {
            if (shouldRefresh) {
                loadPics()
                await dispatch(shouldRefreshSet(false))
            }
        }
        refreshConditionally()
    })

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            loadPics()
        })
        return () => task.cancel()
    }, [])

    //-----------------------------------------------------LOAD PICS--------------------------------------------------------

    //-----------------------------------------------------PERMISSION CHECKER--------------------------------------------------------
    const greenLightOnPermissions = useSelector(
        (state) => state.permissionsReducer.permissions.camera
    )

    function openSettings() {
        Platform.OS === 'android'
            ? Linking.openSettings()
            : Linking.canOpenURL('app-settings:')
                  .then((supported) => {
                      if (!supported) {
                          console.log("Can't handle settings url")
                      } else {
                          return Linking.openURL('app-settings:')
                      }
                  })
                  .catch((err) => console.error('An error occurred', err))
    }

    const sendUserToSettingsHandler = useCallback(() => {
        const alertMessage =
            'Turn On Camera Permissions to Allow Event Share to Scan QR Codes'
        Platform.OS === 'android' ? androidAlert() : IOSAlert()

        function IOSAlert() {
            Alert.alert(alertMessage, '', [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Settings',
                    onPress: () => {
                        openSettings()
                    },
                },
            ])
        }
        function androidAlert() {
            Alert.alert('', alertMessage, [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Settings',
                    onPress: () => {
                        openSettings()
                    },
                },
            ])
        }
    }, [])

    const navFunction = useCallback(() => {
        navigation.navigate('CameraScreen', {
            checkMarkSet: 'checkMarkSet',
            galleryID,
        })
    }, [])

    const cameraPressedHandler = useCallback(async () => {
        if (greenLightOnPermissions === 'granted') {
            navFunction()
        } else {
            const { status } = await Camera.getPermissionsAsync()
            const audioStatus = await Audio.getPermissionsAsync()

            if (status && audioStatus.status === 'granted') {
                dispatch(loadPermissions('granted'))
                navFunction()
            } else if (status || audioStatus.status === 'undetermined') {
                const results = await Camera.requestPermissionsAsync()
                const audioResults = await Audio.requestPermissionsAsync()
                if (results.status && audioResults.status === 'granted') {
                    navFunction()
                } else if (results.status || audioResults.status === 'denied') {
                    sendUserToSettingsHandler()
                    return
                }
            } else if (status || audioResults.status === 'denied') {
                const results2 = await Camera.requestPermissionsAsync()
                const audioResults2 = await Audio.requestPermissionsAsync()
                if (results2.status && audioResults2 === 'granted') {
                    navFunction()
                } else {
                    sendUserToSettingsHandler()
                    return
                }
            }
        }
    }, [greenLightOnPermissions])
    //-----------------------------------------------------PERMISSION CHECKER--------------------------------------------------------

    const goBack = useCallback(() => {
        navigation.goBack()
        dispatch(emptyPicsArray())
    }, [])

    //----------------------------------------------------FLAT LIST OPTIMIZATION--------------------------------------------------------
    const ListEmptyComponent = useCallback(() => {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: height - 40 - insets.top,
                }}
            >
                <Text
                    style={{
                        fontSize: 16,
                        width: '50%',
                        flexWrap: 'wrap',
                        textAlign: 'center',
                    }}
                >
                    There are no pictures in this gallery, add some!
                </Text>
            </View>
        )
    }, [])

    const keyExtractor = useCallback((item) => item.id, [])

    const getItemLayout = useCallback(
        (data, index) => ({
            length: width / 2,
            offset: (width / 2) * index,
            index: index,
        }),
        []
    )

    const renderItem = useCallback(({ item, index }) => {
        return (
            <ThumbnailSmall
                key={item.id}
                images={item}
                picturePressedHandler={() => {
                    picturePressedHandler(pics, index, item.id, item.fullPath)
                }}
                navigation={navigation}
            />
        )
    }, [])
    //----------------------------------------------------FLAT LIST OPTIMIZATION--------------------------------------------------------

    //----------------------------------------------------------------have to normalize uri----------------------------------------------------------------
    const normalizedSource = () => {
        const imageString = `${thumbnail}`
        const normalizedSource =
            imageString &&
            typeof imageString === 'string' &&
            !imageString.split('http')[1]
                ? null
                : imageString
        return normalizedSource
    }
    //----------------------------------------------------------------have to normalize uri----------------------------------------------------------------

    return (
        <PanGestureHandler
            ref={panViewRef}
            onGestureEvent={onGestureEvent}
            enabled={enable}
            activeOffsetY={5}
            failOffsetY={-5}
        >
            <Animated.View
                style={[
                    { flex: 1, backgroundColor: 'white', overflow: 'hidden' },
                    panGestureStyle,
                ]}
            >
                <ScreenWrapper
                    //old way of handling gesture event
                    // onStartShouldSetResponderCapture={scrollChecker}
                    style={{ paddingBottom: 0 }}
                >
                    <SharedElement
                        id={`${galleryID}`}
                        style={styles.sharedElement}
                    >
                        <FastImage
                            style={styles.imageBg}
                            resizeMode={FastImage.resizeMode.cover}
                            source={{
                                uri: normalizedSource(),
                                // headers: { Authorization: 'someAuthToken' },
                                priority: FastImage.priority.normal,
                            }}
                        />
                    </SharedElement>
                    <SharedElement
                        id={`${galleryID}${galName}`}
                        style={{
                            ...styles.sharedElementText,
                            marginTop: insets.top,
                        }}
                    >
                        <Text
                            style={styles.animatedTitle}
                            maxFontSizeMultiplier={colors.maxFontSizeMultiplier}
                        >
                            {galName}
                        </Text>
                    </SharedElement>
                    <HeaderBasic
                        rightButton
                        goBack={goBack}
                        // header="Your Event"
                        headerColor={{ color: colors.darkestColorP1 }}
                        iconName="chevron-down-outline"
                        rightIcon="camera-outline"
                        rightIconSize={30}
                        onPressRight={cameraPressedHandler}
                    />
                    <FlatList
                        ref={scrollViewRef}
                        data={pics}
                        keyExtractor={keyExtractor}
                        getItemLayout={getItemLayout}
                        renderItem={renderItem}
                        onRefresh={loadPics}
                        refreshing={loadingPics}
                        waitFor={enable ? panViewRef : scrollViewRef}
                        scrollEventThrottle={16}
                        onScroll={onScroll}
                        style={styles.flatList}
                        showsVerticalScrollIndicator={false}
                        numColumns={3}
                        initialNumToRender={5}
                        windowSize={7}
                        updateCellsBatchingPeriod={100}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={12}
                        contentContainerStyle={{
                            paddingBottom: tabBarBottomPosition + 60,
                        }}
                        onScrollEndDrag={handleScroll}
                        ListEmptyComponent={
                            isFocused ? ListEmptyComponent : null
                        }
                        //Risky
                        removeClippedSubviews={true}
                        // alwaysBounceVertical={false}
                        // bounces={false}
                    />
                    <Animated.View
                        pointerEvents={'none'}
                        style={[
                            styles.loadingView,
                            opacityStyle,
                            {
                                top: insets.top + 40,
                            },
                        ]}
                    >
                        <ActivityIndicator />
                    </Animated.View>
                </ScreenWrapper>

                {/* <GalDetailBottomSheet
                    ref={bottomSheetRef}
                    data={pics}
                    navigation={navigation}
                    index={scrollIndex}
                /> */}
            </Animated.View>
        </PanGestureHandler>
    )
}

const styles = StyleSheet.create({
    sharedElement: {
        flex: 1,
        position: 'absolute',
        right: 0,
        left: 0,
        top: 0,
        bottom: 0,
        height: height,
        width: width,
    },
    sharedElementText: {
        position: 'absolute',
        right: 0,
        left: 0,
        top: 0,
        bottom: 0,
        height: 40,
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
    },
    animatedTitle: {
        fontSize: 21,
        fontWeight: 'bold',
        textAlign: 'center',
        color: colors.darkestColorP1,
    },
    imageBg: {
        flex: 1,
        opacity: 0,
        height: height,
        width: width,
    },
    flatList: {
        marginTop: 10,
        flex: 1,
    },
    loadingView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        position: 'absolute',
        width: '100%',
        bottom: 0,
    },
})

export default GalleryView
