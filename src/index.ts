import imageSize from 'image-size'
import fs from 'fs'
import pascalCase from './utils/pascalCase'
import formatCode from './utils/formatCode'
import imagemin from 'imagemin'
import imageminJpegtran from 'imagemin-jpegtran'
import imageminPngquant from 'imagemin-pngquant'

const root = 'build'

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

  console.log('height: ' + imageSizeInfo.height)
  console.log('width: ' + imageSizeInfo.width)

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
    import styles from './index.module.less'
  
    type Props = {}
  
    const ${componentName}: React.FC<Props> = () => {
      return (
        <View className={styles.${componentName}}></View>
      )
    }
  
    export default ${componentName}
  `
  const tsxFilePath = `${root}/${componentName}/index.tsx`

  fs.writeFileSync(tsxFilePath, formatCode(tsxCode))

  fs.writeFileSync(
    `${root}/${componentName}/index.module.less`,
    formatCode(
      `
    .${componentName}{
      width: ${imageSizeInfo.width}px;
      height: ${imageSizeInfo.height}px;
      background-image: url('./${imageFileName}');
      background-size: 100% 100%;
    }`,
      {
        parser: 'less',
      }
    )
  )

  fs.unlinkSync(imageFileName)
}
