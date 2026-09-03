"use client"

import { useRef, useState } from "react"
import { Play, Pause } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { israelMusic } from "@/content/israel"

export function MusicSection() {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <section id="musica" className="bg-sage-100/60 py-20 dark:bg-sage-900/60">
      <video ref={videoRef} src={israelMusic.videoSrc} style={{ display: "none" }} preload="auto" onEnded={() => setIsPlaying(false)} />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-sage-800 dark:text-sage-100 md:text-5xl">
            Música: <span>{israelMusic.title}</span>
          </h2>
          <Badge variant="secondary">De: Israel Andreo</Badge>
        </div>

        <Card className="border-0 bg-white/80 shadow-2xl dark:bg-sage-800/80">
          <CardContent className="p-8 md:p-12">
            <div className="mb-8 flex justify-center">
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pausar" : "Tocar"}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-sage-500 text-white shadow-lg transition-colors hover:bg-sage-600"
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
              </button>
            </div>
            <div className="space-y-6 text-center text-sage-700 dark:text-sage-200">
              {israelMusic.lyrics.map((lyric, index) => (
                <p key={index} className={lyric.isChorus ? "font-medium text-sage-600 dark:text-sage-300" : ""}>
                  {lyric.text.split("\n").map((line, lineIndex) => (
                    <span key={lineIndex}>
                      {line}
                      {lineIndex < lyric.text.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
