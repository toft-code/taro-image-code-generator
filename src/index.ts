import imageSize from 'image-size'
import fs from 'fs'
import pascalCase from './utils/pascalCase'
import formatCode from './utils/formatCode'
import imagemin from 'imagemin'
import imageminJpegtran from 'imagemin-jpegtran'
import imageminPngquant from 'imagemin-pngquant'

const root = 'build'

// const directoryPath = path.join(__dirname, './')
fs.readdir('./', function (err, files) {
  if (err) {
    return console.log('Unable to scan directory: ' + err)
  }

  files.forEach(function (file) {
    const type = file.split('.').pop()

    if (type === 'png' || type === 'jpg' || type === 'jpeg') {
      generate(file)
    }
  })
})

async function generate(imageFileName: string) {
  const componentName = pascalCase(imageFileName.split('.')[0])
  const imageSizeInfo = imageSize(imageFileName)

  fs.rmdirSync(root, { recursive: true })
  fs.mkdirSync(root)
  fs.mkdirSync(`${root}/${componentName}`)

  const res = await imagemin([imageFileName], {
    destination: `${root}/${componentName}`,
    plugins: [
      imageminJpegtran(),
      imageminPngquant({
        quality: [0.6, 0.8],
      }),
    ],
  })

  const tsxCode = `
    import { View } from '@tarojs/components'
    import React from 'react'
    import Taro from '@tarojs/taro'
    import './index.scss'
  
    type Props = {}
  
    const ${componentName}: React.FC<Props> = () => {
      return (
        <View className="${componentName}"></View>
      )
    }
  
    export default ${componentName}
  `
  const tsxFilePath = `${root}/${componentName}/index.tsx`

  fs.writeFileSync(tsxFilePath, formatCode(tsxCode))

  fs.writeFileSync(
    `${root}/${componentName}/index.scss`,
    formatCode(
      `
    .${componentName}{
      width: ${imageSizeInfo.width}rpx;
      height: ${imageSizeInfo.height}rpx;
      background-image: url('./${imageFileName}');
      background-size: 100% 100%;
    }`,
      {
        parser: 'scss',
      }
    )
  )

  fs.unlinkSync(imageFileName)
}
