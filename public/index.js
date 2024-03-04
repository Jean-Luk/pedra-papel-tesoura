const socket = io();

let meuID = null

socket.on('id', (idRecebido) => {
    meuID = idRecebido;

})

let emJogo = false;
let entrandoSala = false;
let salaAtualID = null;
let salaAtual;

// DIVs

const div_entrarSala = document.getElementById("div_entrarSala"); // Página inicial para entrar ou criar uma sala

const div_sala = document.getElementById("div_sala"); // Lobby de uma sala
const div_iniciarJogo = document.getElementById("div_iniciarJogo");
const div_mensagemAguardar = document.getElementById("div_mensagemAguardar")

const div_jogo = document.getElementById("div_jogo"); // Em jogo
const div_jogarNovamente = document.getElementById("div_jogarNovamente");
const div_sairOuAguardar = document.getElementById("div_sairOuAguardar");

// Botões
const button_criarSala = document.getElementById("button_criarSala");
const button_entrarSala = document.getElementById("button_entrarSala");
const buttons_sairSala = document.getElementsByClassName("buttons_sairSala");
const buttons_iniciarJogo = document.getElementsByClassName("buttons_iniciarJogo");

// Inputs
const input_apelido = document.getElementById("input_apelido");
const input_idSala = document.getElementById("input_idSala");


function exibirInicio () {
    div_entrarSala.style.display = "block"
    div_sala.style.display = "none"
    div_jogo.style.display = "none"

    emJogo = false;
}

function exibirLobby (sala) {
    salaAtualID = sala.id;
    document.getElementById("span_idSala").innerHTML = sala.id;

    div_entrarSala.style.display = "none"
    div_sala.style.display = "block"
    div_jogo.style.display = "none"

    emJogo = false;
    atualizarLista(sala);
}

function exibirJogo (estado) {
    div_entrarSala.style.display = "none"
    div_sala.style.display = "none"
    div_jogo.style.display = "block"
    if (estado === "partida") { // Aguardando jogada:
        div_jogarNovamente.style.display = "none";
        div_sairOuAguardar.style.display = "none";
    } else if (estado === "final") { // Fim da rodada:
        div_jogarNovamente.style.display = "block";
        div_sairOuAguardar.style.display = "block";
    }

    emJogo = true;
}

exibirInicio();

function verificarApelido () {
    const apelido = document.getElementById("input_apelido").value;

    if (apelido.length === 0) {
        tremerElemento(document.getElementById("input_apelido"))
        return false;
    }
    if (apelido.length < 3) {
        alert("Insira um apelido com pelo menos 3 caracteres");
        return false;
    }

    return apelido;
}

function verificarIdInserido () {
    const idInserido = input_idSala.value;

    if (idInserido.length < 1 || isNaN(Number(idInserido))) {
        tremerElemento(input_idSala)
        return false
    } else {
        return idInserido
    }
}
button_criarSala.addEventListener("click", () => {
    if (!meuID || entrandoSala) return; // Previne de entrar em sala caso não tenha carregado o ID ou caso já esteja entrando em uma sala
    
    apelido = verificarApelido()
    
    if (apelido) {
            entrandoSala = true;
        socket.emit("criarSala", meuID, apelido);
    }

})

socket.on('criouSala', (idRecebido, sucesso, sala) => {
    if (idRecebido != meuID) return;

    entrandoSala = false;

    if (!sucesso[0]) return alert(`Erro: ${sucesso[1]}`);    

    exibirLobby(sala);

})

button_entrarSala.addEventListener("click", () => {
    console.log(meuID);
    if (!meuID || entrandoSala) return; // Previne de entrar em sala caso não tenha carregado o ID ou caso já esteja entrando em uma sala

    const apelido = verificarApelido();
    if (!apelido) return;

    const idSala = verificarIdInserido()
    if (!idSala) {
        return
    }

    entrandoSala = true;
    socket.emit("entrarSala", meuID, apelido, Number(idSala));
})

socket.on('entrouSala', (idRecebido, sucesso, idSala, sala) => {
    if (idSala == salaAtualID && sucesso[0]) { // Atualizar a lista quando alguém entrar na sala atual
        atualizarLista(sala);
    }

    if (idRecebido != meuID) return;
    entrandoSala = false;
    
    if (!sucesso[0]) return alert(`Erro: ${sucesso[1]}`);
    
    exibirLobby(sala);

})

for (const button of buttons_sairSala) {
    button.addEventListener("click", () => {
        socket.emit("sairSala", meuID, salaAtualID)
    })
}

socket.on('saiuSala', (idRecebido, idSala, sala) => {
    if (idRecebido == meuID) {
        saiuSala();
    } else {
        if (idSala == salaAtualID) { // Se alguém da sala atual saiu
            if (emJogo) { // Se estiver em jogo, ir para o lobby e avisar
                exibirLobby(sala);
                alert("O adversário abandonou a partida.")
            } else { // Se não, apenas atualizar a lista
                atualizarLista(sala);
            }
        }
    }
})


function atualizarLista (sala) {

    salaAtual = sala;

    if (salaAtual.jogadores[0].id === meuID) { // Se for o criador da sala, exibir botão de iniciar jogo
        div_iniciarJogo.style.display = "block";
        div_mensagemAguardar.style.display = "none";
    } else { // Se não, exibir mensagem para aguardar
        div_iniciarJogo.style.display = "none";
        div_mensagemAguardar.style.display = "block";
    }

    let index = 1

    let lista = "<table><tr><td></td> <td> <b>Apelido</b> </td><td> <b>Cargo</b> </td></tr>";
    for(const jogador of sala.jogadores) {
        lista += `<tr><td><b>${index}-</b></td> <td> ${jogador.apelido} </td>`;
        index === 1 ? lista += `<td> Criador </td></tr>` : lista += `<td> Jogador </td></tr> `;

        index++
    }
    lista += `</table>`
    document.getElementById("span_listaSala").innerHTML = lista    

}

function saiuSala () {
    alert("Você saiu da sala.")

    exibirInicio();
    salaAtualID = null;
    emJogo = false;
}

for (const button of buttons_iniciarJogo) {
    button.addEventListener("click", () => {
        if (salaAtual.jogadores.length < 2) return alert("Não há jogadores suficientes");
        if (salaAtual.jogadores[0].id != meuID) return alert("Somente o criador da sala pode iniciar o jogo");
    
        socket.emit("iniciarJogo", salaAtualID, meuID);
    })
}


socket.on('iniciouJogo', (salaID, sala) => {
    if (salaID != salaAtualID) return

    emJogo = true;

    exibirJogo("partida");

    for (const button of buttonsJogar) {
        button.disabled = false;
    }

    document.getElementById("span_apelidoJogador2").innerHTML = sala.jogadores[1].apelido;
    document.getElementById("span_apelidoJogador1").innerHTML = sala.jogadores[0].apelido;

    document.getElementById("img_jogadaJogador1").setAttribute("src", "./img/aguardando.gif")
    document.getElementById("img_jogadaJogador2").setAttribute("src", "./img/aguardando.gif")

    document.getElementById("span_mensagemJogo").innerHTML = "Faça sua jogada";

})

const buttonsJogar = [
    document.getElementById("button_jogarPedra"),
    document.getElementById("button_jogarPapel"),
    document.getElementById("button_jogarTesoura"),
]

for (const index in buttonsJogar) {
    buttonsJogar[index].addEventListener("click", () => {
        socket.emit("jogar", Number(index)+1, salaAtualID, meuID);        
    })
}

socket.on("jogou", (salaID, idRecebido) => {
    if (salaID != salaAtualID) return;
    if (idRecebido == meuID) {
        for (const button of buttonsJogar) {
            button.disabled = true;
        }

        document.getElementById("span_mensagemJogo").innerHTML = "Aguardando adversário...";
    }
})

socket.on("encerrouJogo", (salaID, sala) => {
    if (salaID != salaAtualID) return;

    const jogadores = sala.jogadores;
    const jogadas = ["", "Pedra", "Papel", "Tesoura"];
    const imagens = ["", "./img/pedra.png", "./img/papel.png", "./img/tesoura.png"];

    document.getElementById("span_jogadaJogador1").innerHTML = jogadas[sala.jogadores[0].jogada];
    document.getElementById("span_jogadaJogador2").innerHTML = jogadas[sala.jogadores[1].jogada];
    document.getElementById("img_jogadaJogador1").setAttribute("src", imagens[sala.jogadores[0].jogada])
    document.getElementById("img_jogadaJogador2").setAttribute("src", imagens[sala.jogadores[1].jogada])

    
    const vencedor = jogadores[0].jogada+1 === jogadores[1].jogada || jogadores[0].jogada-2 === jogadores[1].jogada ? 1 : jogadores[0].jogada === jogadores[1].jogada ? null : 0;
    const span_mensagemJogo = document.getElementById("span_mensagemJogo");
    
    if (vencedor === null) {
        span_mensagemJogo.innerHTML = "Empate!"
    } else {
        span_mensagemJogo.innerHTML = jogadores[vencedor].id === meuID ? span_mensagemJogo.innerHTML = "Você venceu!" : span_mensagemJogo.innerHTML = "Você perdeu!";
    }

    if (sala.jogadores[0].id === meuID) { // Se for o criador, exibir o botão jogar novamente
        div_jogarNovamente.style.display = "block";
        div_sairOuAguardar.style.display = "none";
    } else { // Se não, exibir mensagem para aguardar
        div_jogarNovamente.style.display = "none";
        div_sairOuAguardar.style.display = "block";
    }
})


function tremerElemento(elemento) {
    elemento.classList.add('tremer');

    setTimeout(function() {
        elemento.classList.remove('tremer');
    }, 300);
}