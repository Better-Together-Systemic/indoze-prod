export default function ModalOrigem({ aoFechar }) {
  return (
    <div className="modal-fundo ativa" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-origem">
        <button className="fechar" onClick={aoFechar} aria-label="Fechar">&times;</button>
        <h2 id="titulo-origem">Como o INDOZE nasceu</h2>
        <p>
          Tudo começou com um caderno guardado. Um caderno de escola de 1997,
          escrito à mão por um menino chamado Oswaldo — o pai da Eliane.
          "O Mundo Pelos Olhos de Oswaldo", dizia a capa.
        </p>
        <p>
          E antes dele, uma bisavó que trançava taquara e fazia ninhos com as próprias mãos.
          Ela sabia, sem que ninguém tivesse ensinado, que todo ninho precisa de um indez:
          aquele ovinho que se deixa no lugar certo para mostrar à galinha onde botar.
        </p>
        <p>
          É disso que o INDOZE é feito: da sabedoria antiga encontrando um jeito novo de continuar.
          A intuição dos antigos encontrou a tecnologia. E assim nasceu este ninho digital,
          onde cada pessoa é acolhida por doze dias para chocar as próprias descobertas.
        </p>
      </div>
    </div>
  )
}
