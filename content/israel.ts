export interface MusicLyricLine {
  text: string
  isChorus: boolean
}

export interface PersonContent {
  name: string
  years: string
  heroPhoto: string
  tagline: string
}

export const israelContent: PersonContent = {
  name: "Israel Andreo",
  years: "1951 – 2023",
  heroPhoto: "/assets/img/israel-hero.jpeg",
  tagline: "Uma vida dedicada ao amor, à música e à família.",
}

export const israelMusic = {
  title: "Vida Melhor",
  videoSrc: "/rael2.mp4",
  lyrics: [
    {
      text: "Eu fiz de tudo pra tratar vida melhor,\nEu trabalhei eu derramei o meu suor,\nNão tive estudo foi por isso que sofri,\nPouca visão, sem profissão, mas consegui.",
      isChorus: false,
    },
    {
      text: "Corri, parei, sorri, mas também chorei,\nEu construí, eu desmanchei,\nFui insistente e não desanimei",
      isChorus: true,
    },
    {
      text: "Homem valente é aquele que trabalha,\nLuta com fé e não perde a batalha.\nNa minha vida muita luta enfrentei",
      isChorus: false,
    },
    {
      text: "Corri, parei, sorri, mas também chorei,\nEu construí, eu desmanchei,\nFui insistente e não desanimei",
      isChorus: true,
    },
  ] satisfies MusicLyricLine[],
}
