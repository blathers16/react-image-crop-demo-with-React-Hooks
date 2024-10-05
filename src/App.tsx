import React, { useState, useRef } from 'react'

import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import { canvasPreview } from './canvasPreview'
import { useDebounceEffect } from './useDebounceEffect'

import 'react-image-crop/dist/ReactCrop.css'

export default function App() {
  const [imgSrc, setImgSrc] = useState('')
  const imgRef = useRef<HTMLImageElement>(null)
  const divRef = useRef<HTMLDivElement>(null)
  const topCanvasRef = useRef<HTMLCanvasElement>(null)
  const bottomCanvasRef = useRef<HTMLCanvasElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined) // Update cropping when loading a new image
      const reader = new FileReader()
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      )
      reader.readAsDataURL(e.target.files[0])
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop({
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 50, // Initial selection of about half of the picture
    })
    divRef.current?.scrollTo(0, Math.min(height / 2 - 600, 16383))
  }

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        topCanvasRef.current &&
        bottomCanvasRef.current
      ) {
        const image = imgRef.current
        // const scaleY = image.naturalHeight / image.height
        // const scaleX = image.naturalWidth / image.width

        const cropHeightPx = completedCrop.height * 2

        canvasPreview(image, topCanvasRef.current, {
          unit: 'px',
          x: 0,
          y: 0,
          width: image.width,
          height: cropHeightPx,
        })

        canvasPreview(image, bottomCanvasRef.current, {
          unit: 'px',
          x: 0,
          y: cropHeightPx,
          width: image.width,
          height: image.height - cropHeightPx,
        })
      }
    },
    100,
    [completedCrop],
  )

  async function onDownloadTopClick() {
    if (!topCanvasRef.current) {
      return
    }
    const topBlob = await new Promise<Blob | null>((resolve) =>
      topCanvasRef.current!.toBlob(resolve),
    )
    if (topBlob) {
      const blobFile = new File([topBlob], { type: 'image/png' })
      const topBlobUrl = URL.createObjectURL(blobFile)
      downloadBlob(topBlobUrl, 'top-image.png')
    }
  }

  async function onDownloadBottomClick() {
    if (!bottomCanvasRef.current) {
      return
    }
    const bottomBlob = await new Promise<Blob | null>((resolve) =>
      bottomCanvasRef.current!.toBlob(resolve),
    )
    if (bottomBlob) {
      const blobFile = new File([bottomBlob], { type: 'image/png' })
      const bottomBlobUrl = URL.createObjectURL(blobFile)
      downloadBlob(bottomBlobUrl, 'bottom-image.png')
    }
  }

  function downloadBlob(blobUrl: string, filename: string) {
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="App">
      <div className="Crop-Controls">
        <input type="file" accept="image/*" onChange={onSelectFile} />
      </div>
      {!!imgSrc && (
        <div
          style={{
            maxHeight: '1200px',
            overflow: 'auto',
            transform: 'scale(0.5)',
            margin: `-${Math.min((imgRef.current?.height ?? 0) / 4, 300)}px 0`,
          }}
          ref={divRef}
        >
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => {
              setCrop({
                ...percentCrop,
                x: 0,
                y: 0,
                width: 100,
              })
            }}
            onComplete={(c) => setCompletedCrop(c)}
            minHeight={10}
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imgSrc}
              style={{ maxHeight: 'none', maxWidth: '100%' }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>
      )}
      {!!completedCrop && (
        <>
          <div>
            <h3>top part</h3>
            <canvas
              ref={topCanvasRef}
              style={{
                border: '1px solid black',
                width: '100%',
                maxWidth: '400px',
              }}
            />
            <button onClick={onDownloadTopClick}>Save the top part</button>
          </div>
          <div>
            <h3>bottom part</h3>
            <canvas
              ref={bottomCanvasRef}
              style={{
                border: '1px solid black',
                width: '100%',
                maxWidth: '400px',
              }}
            />
            <button onClick={onDownloadBottomClick}>
              Save the bottom part
            </button>
          </div>
        </>
      )}
    </div>
  )
}
