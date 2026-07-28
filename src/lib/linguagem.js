/**
 * Linguagem acolhedora: a plataforma fala com cada pessoa do jeito dela.
 * A detecção é um palpite educado; quem decide é sempre a pessoa, no cadastro.
 */

const EXCECOES_MASCULINAS = [
  'luca','joshua','noah','nicola','elias','tobias','jonas','dinis',
  'aristoteles','vinicius','tadeu','mateus','matheus','andre','ze','nicolas',
]

const EXCECOES_FEMININAS = [
  'beatriz','ines','raquel','isis','iris','ester','esther','carmen','miriam',
  'mirian','lais','nicole','rute','ruth','abigail','dulce','mercedes','soledade',
  'caroline','doris','heloise','marlene','marilene','darlene','ivone','yvone',
  'simone','solange','tais','thais','cristiane','luciane','eliane','rosane',
  'rosangela','viviane','fabiane','adriane','juliane','daniele','danielle',
  'gabrielle','isabelle','michelle','isabel','maribel','cris','liz','flor',
]

/** Devolve 'm', 'f' ou 'n' (neutro) a partir do primeiro nome. */
export function detectarGenero(nomeCompleto) {
  const nome = (nomeCompleto ?? '').trim().toLowerCase().split(/\s+/)[0]
  if (!nome) return 'n'

  if (EXCECOES_MASCULINAS.includes(nome)) return 'm'
  if (EXCECOES_FEMININAS.includes(nome)) return 'f'

  const t1 = nome.slice(-1)
  const t2 = nome.slice(-2)
  const t3 = nome.slice(-3)

  if (t1 === 'a' || t2 === 'ce' || t3 === 'ete') return 'f'
  if (['o','r','l','s','u','e'].includes(t1)) return 'm'
  if (['el','on','io','ir'].includes(t2)) return 'm'

  return 'n'
}

/** Escolhe a palavra certa conforme o tratamento da pessoa. */
export function g(genero, masc, fem, neutro) {
  if (genero === 'm') return masc
  if (genero === 'f') return fem
  return neutro !== undefined ? neutro : fem
}

/** Texto do card "Você não está sozinha" — reescrito no neutro para soar natural. */
export function textoAcolhida(genero) {
  if (genero === 'n') {
    return {
      titulo: 'Você não está só',
      texto:
        'Ninguém aprende sem companhia. Sua família, seus antepassados e você ' +
        'estão todos incluídos neste ninho. Aqui você existe, faz parte e pode se sentir em segurança.',
    }
  }
  return {
    titulo: `Você não está ${g(genero, 'sozinho', 'sozinha')}`,
    texto:
      `Ninguém aprende ${g(genero, 'sozinho', 'sozinha')}. Sua família, seus antepassados e você mesmo ` +
      `estão todos incluídos neste ninho. Aqui você existe, está ${g(genero, 'incluído', 'incluída')} ` +
      `e pode se sentir ${g(genero, 'seguro', 'segura')}.`,
  }
}

/** Saudação do Indez, já no tratamento certo. */
export function saudacaoIndez(nome, genero) {
  const primeiro = (nome ?? '').split(' ')[0]
  const incl = g(genero, 'incluído', 'incluída', 'parte do ninho')
  const seg = g(genero, 'seguro', 'segura', 'em segurança')
  return `Oi, ${primeiro}. Que bom que você chegou no ninho. 🥚 Aqui você existe, está ${incl} e pode se sentir ${seg}. Me conta: o que está passando dentro de você hoje?`
}

/** Instrução de tratamento que vai junto no pedido ao Indez. */
export function instrucaoGenero(nome, genero) {
  const primeiro = (nome ?? '').split(' ')[0]
  if (genero === 'm')
    return `\n\nTRATAMENTO: A pessoa se chama ${primeiro} e prefere ser tratada no MASCULINO (ex.: "incluído", "acolhido", "bem-vindo", "sozinho"). Use sempre a concordância masculina ao se dirigir a ela.`
  if (genero === 'f')
    return `\n\nTRATAMENTO: A pessoa se chama ${primeiro} e prefere ser tratada no FEMININO (ex.: "incluída", "acolhida", "bem-vinda", "sozinha"). Use sempre a concordância feminina ao se dirigir a ela.`
  return `\n\nTRATAMENTO: A pessoa se chama ${primeiro} e prefere linguagem NEUTRA. Evite adjetivos com marca de gênero ao se dirigir a ela; reescreva as frases para não precisar escolher entre masculino e feminino (ex.: em vez de "seja bem-vindo/a", use "que bom ter você aqui").`
}

/* ------------------------- estado dos 12 dias ------------------------- */

/**
 * Um ovo choca de cada vez:
 *   'feito'    — já guardado, vira memória (só leitura)
 *   'aberto'   — é a vez desta pessoa escrever
 *   'trancado' — ainda não chegou a hora
 */
export function estadoDoDia(dia, reflexoes) {
  const tem = (n) => Boolean(reflexoes?.[n]?.trim())
  if (tem(dia)) return 'feito'
  if (dia === 1) return 'aberto'
  if (tem(dia - 1)) return 'aberto'
  return 'trancado'
}

export function contarDiasFeitos(reflexoes) {
  let n = 0
  for (let d = 1; d <= 12; d++) if (reflexoes?.[d]?.trim()) n++
  return n
}
