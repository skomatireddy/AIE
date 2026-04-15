import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { useDeviceCapabilities } from '../../hooks/useDeviceCapabilities'

// Lazy-load panels
import DepthPanel from '../labs/vision/DepthPanel'
import ClassifyPanel from '../labs/vision/ClassifyPanel'
import DetectPanel from '../labs/vision/DetectPanel'
import SegmentPanel from '../labs/vision/SegmentPanel'
import CaptionPanel from '../labs/vision/CaptionPanel'
import SentimentPanel from '../labs/language/SentimentPanel'
import NERPanel from '../labs/language/NERPanel'
import SummarizePanel from '../labs/language/SummarizePanel'
import TranslatePanel from '../labs/language/TranslatePanel'
import QAPanel from '../labs/language/QAPanel'
import ASRPanel from '../labs/audio/ASRPanel'
import AudioClassPanel from '../labs/audio/AudioClassPanel'
import SimilarityPanel from '../labs/multimodal/SimilarityPanel'
import Gemma4Panel from '../labs/multimodal/Gemma4Panel'
import ImageTo3D from '../../features/image-to-3d/ImageTo3D'

const PANELS = {
  depth:         DepthPanel,
  classify:      ClassifyPanel,
  detect:        DetectPanel,
  segment:       SegmentPanel,
  caption:       CaptionPanel,
  sentiment:     SentimentPanel,
  ner:           NERPanel,
  summarize:     SummarizePanel,
  translate:     TranslatePanel,
  qa:            QAPanel,
  asr:           ASRPanel,
  audioclassify: AudioClassPanel,
  similarity:    SimilarityPanel,
  gemma4:        Gemma4Panel,
  img3d:         ImageTo3D,
}

export default function AppShell() {
  const [active, setActive] = useState('depth')
  const { hasWebGPU } = useDeviceCapabilities()

  const Panel = PANELS[active] || DepthPanel

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-950 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🤖</span>
          <div>
            <h1 className="font-bold text-sm text-zinc-100">AI Vision Explorer</h1>
            <p className="text-[10px] text-zinc-500">Transformers.js — fully in-browser, no server</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasWebGPU && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 font-medium">
              WebGPU Available
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
            15 Labs
          </span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={active} onSelect={setActive} />
        <main className="flex-1 overflow-y-auto p-5 bg-zinc-950">
          <Panel key={active} />
        </main>
      </div>
    </div>
  )
}
