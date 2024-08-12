//file system
import * as FileSystem from 'expo-file-system'

const makeSureDirectoryExists = async ({ directory }) => {
    const tmpDir = await FileSystem.getInfoAsync(directory)
    // create cacheDir if does not exist
    if (!tmpDir.exists) {
        await FileSystem.makeDirectoryAsync(directory)
    }
}

export const cleanupCache = async ({ size = 400 } = { size: 400 }) => {
    const filesystemURI = FileSystem.cacheDirectory + 'images/'

    console.log("teset")

    makeSureDirectoryExists({ directory: filesystemURI })

    // await makeSureDirectoryExists({ directory: filesystemURI })
    // cleanup old cached files
    const cachedFiles = await FileSystem.readDirectoryAsync(`${filesystemURI}`)
    console.log(
        '🚀 ~ file: App.js ~ line 61 ~ cleanupCache ~ cachedFiles',
        cachedFiles
    )

    let position = 0
    let results = []
    const batchSize = 20

    // batching promise.all to avoid exxessive promisses call
    while (position < cachedFiles.length) {
        const itemsForBatch = cachedFiles.slice(position, position + batchSize)
        results = [
            ...results,
            ...(await Promise.all(
                itemsForBatch.map(async (file) => {
                    // eslint-disable-line
                    const info = await FileSystem.getInfoAsync(
                        `${filesystemURI}${file}`
                    ) // eslint-disable-line
                    return Promise.resolve({
                        file,
                        modificationTime: info.modificationTime,
                        size: info.size,
                    })
                })
            )),
        ]
        position += batchSize
    }

    // cleanup cache, leave only 500mb wirth of most recent files
    results.sort((a, b) => a.modificationTime - b.modificationTime)

    let sumSize = results.reduce(
        (accumulator, currentValue) => accumulator + Number(currentValue.size),
        0
    )

    // let's calculate the sum in the first pass
    // second pass to clean up the cach files based on the total size of files in the cache
    for (let i = 0; i < results.length; i += 1) {
        if (sumSize > size * 1000 * 1000) {
            // 0.4GB
            FileSystem.deleteAsync(`${filesystemURI}${results[i].file}`, {
                idempotent: true,
            })
            sumSize -= results[i].size
        }
    }
    console.log("done")
}
