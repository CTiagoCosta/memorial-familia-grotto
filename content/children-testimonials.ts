import type { Person } from "@/types/database"

export interface ChildTestimonial {
  photo: string
  name: string
  person: Person
  description: string
  fullText: string
}

const PLACEHOLDER_DESCRIPTION = "[PLACEHOLDER — a família deve substituir por um texto real]"

function placeholderFullText(childName: string): string {
  return `[PLACEHOLDER — a família deve substituir este texto por um depoimento real de ${childName} sobre a Sônia.]`
}

export const childrenTestimonials: ChildTestimonial[] = [
  {
    photo: "/assets/img/silvana.jpg",
    name: "Silvana Grotto",
    person: "israel",
    description: "Ter você em minha vida sempre foi exemplo de superação...",
    fullText:
      "Ter você em minha vida sempre foi exemplo de superação, honestidade, paciência, dedicação e amor. Como foi bom ter você como pai, sei que aproveitei cada minuto possível com você, fizemos planos e os desfazemos, foram dias incríveis ao seu lado, tudo era possível, otimismo era seu lema, não tinha tempo ruim, mesmo nas horas mais complicadas, mas ainda assim gostaria de mais, mais abraços seus, mais conversas, mais beijos ou apenas ficar pertinho no sofá enquanto você descansava, minha vida tem um marco, com você e sem você, o antes e o depois, tudo tem um novo olhar, um novo significado e nada mais será completo, a cada dia que passa a saudade aumenta, como dói saber que você não está aqui entre nós, mas honrarei sua memória com a prática de seus ensinamentos e seu legado estará vivo para sempre. Com amor sua filha Silvana.",
  },
  {
    photo: "/assets/img/silvio.jpg",
    name: "Silvio Grotto",
    person: "israel",
    description: "Obrigado por plantar raízes, e pegar minha mão para me...",
    fullText:
      "Obrigado por plantar raízes, e pegar minha mão para me ensinar coragem e determinação. Obrigado por dar a vida, dar amor, orientação e mostrar o caminho. Mais que um depoimento, você com certeza merece todo o meu coração e minha gratidão. Seu amor é minha força e sua sabedoria é minha bússola. Na sua simplicidade e honestidade nos passou valores para ser cada vez melhor. Deixa saudades, mas sentimos a sua presença em cada canto e em cada dia que passa. Te amaremos sempre.",
  },
  {
    photo: "/assets/img/sandro.jpg",
    name: "Sandro Grotto",
    person: "israel",
    description: "Pai. O que dizer desse homem, maravilhoso que me deu a...",
    fullText:
      "O que dizer desse homem, maravilhoso que me deu a vida! Tenho tanta coisa pra dizer, mas só quero agradecer, por ter sido seu filho, foi com você que conheci o que é ser um homem honesto e honrado, sou grato por todo tempo que vivi com o senhor papai, sua falta e um vazio enorme no meu coração, te amarei eternamente, obrigada por tudo que aprendi com o senhor.",
  },
  {
    photo: "/assets/img/samira.jpg",
    name: "Samira Grotto",
    person: "israel",
    description: "Saudade de ouvir sua risada, sentir sua alegria, você...",
    fullText:
      "Saudade de ouvir sua risada, sentir sua alegria, você faz muita falta. O que me traz conforto é saber que seu tempo aqui na terra deixou um legado inestimável de aprendizado. Com voce aprendi a ser uma pessoas honesta e persistente. Aprendi o valor do trabalho duro e o mais importante, a ter fé. Quem o conheceu sabe o quanto sofreu na infância e o quanto trabalhou pra criar seus filho, e nos últimos dias de sua vida você me deixou mais uma lição, a gratidão. Quando pedi pra que fizesse um desejo o senhor só agradeceu por tudo que fizemos. Obrigado por ter feito minha vida mais alegre e segura. Sempre levarei os momentos preciosos que passamos juntos. Seu legado de bondade e força permanece em mim. Te amo pra sempre.",
  },
  {
    photo: "/assets/img/silvana.jpg",
    name: "Silvana Grotto",
    person: "sonia",
    description: PLACEHOLDER_DESCRIPTION,
    fullText: placeholderFullText("Silvana"),
  },
  {
    photo: "/assets/img/silvio.jpg",
    name: "Silvio Grotto",
    person: "sonia",
    description: PLACEHOLDER_DESCRIPTION,
    fullText: placeholderFullText("Silvio"),
  },
  {
    photo: "/assets/img/sandro.jpg",
    name: "Sandro Grotto",
    person: "sonia",
    description: PLACEHOLDER_DESCRIPTION,
    fullText: placeholderFullText("Sandro"),
  },
  {
    photo: "/assets/img/samira.jpg",
    name: "Samira Grotto",
    person: "sonia",
    description: PLACEHOLDER_DESCRIPTION,
    fullText: placeholderFullText("Samira"),
  },
]
