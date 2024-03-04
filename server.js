const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

(async function main () {

    app.use(express.static(__dirname + '/public'));
    
    app.get('/', function(req, res) {
        res.sendFile(__dirname + '/public/index.html');
    });

    const salas = [];
    const jogadores = [];

    io.on('connection', function(socket) {
        socket.emit('id', socket.id)
        jogadores.push({id:socket.id, sala:null});

        socket.on('criarSala', async function(idCriador, apelidoCriador) {
            if (typeof(apelidoCriador) != "string" || apelidoCriador.length < 3) return;

            const idSala = salas.length
            
            // Verificar se idCriador é válido
            let indexCriador = null;
            for (const index in jogadores) {
                if (jogadores[index].id == idCriador) {
                    jogadores[index].sala = idSala;
                    indexCriador = index;
                    break
                }
            }

            if (!indexCriador) { // Não achou o ID recebido na lista de jogadores
                socket.emit('criouSala', idCriador, [false, "ID inválido"], null);
                return
            } 

            // Criar sala na lista de salas
            salas[idSala] = {
                id:idSala,
                jogadores:[
                    {id:idCriador, apelido:apelidoCriador, jogada:null}
                ]
            }


            io.emit('criouSala', idCriador, [true, ""], salas[idSala]);
        });

        socket.on('entrarSala', async function(idJogador, apelidoJogador, idSala) {
            if (!salas[idSala]) {
                socket.emit('entrouSala', idJogador, [false, "Sala inexistente"])
                return
            }

            const sala = salas[idSala];
            if (sala.jogadores.length >= 2) {
                socket.emit('entrouSala', idJogador, [false, "Sala cheia"])
                return
            }

            salas[idSala].jogadores.push({id:idJogador, apelido:apelidoJogador, jogada:null})
            for (const jogador of jogadores) {
                if (jogador.id == idJogador) {
                    jogador.sala = idSala;
                    break
                }
            }

            io.emit('entrouSala', idJogador, [true, ""], idSala, sala);
        });

        socket.on('sairSala', (idJogador, idSala) => {
            jogadorSaiu(idSala, idJogador)
        })

        socket.on("iniciarJogo", (idSala, idIniciador) => {
            if (salas[idSala].jogadores[0].id !== idIniciador) {

            } 

            for (const jogador of salas[idSala].jogadores) {
                jogador.jogada = null
            }

            io.emit('iniciouJogo', idSala, salas[idSala])
        })

        socket.on("jogar", (escolha, salaID, jogadorID) => {
            if (!salas[salaID]) return // Se sala não existe
            const sala = salas[salaID]
            if (sala.jogadores.length < 2) return // Se sala possui menos que 2 jogadores

            let jogaram = 0; // Contabilizar se ambos os jogadores já fizeram sua jogada
            let jogadorIndex = null;
            for (const index in sala.jogadores) {
                const jogador = sala.jogadores[index]
                if (jogador.jogada != null) jogaram++
                if (jogador.id === jogadorID) {
                    jogadorIndex = index
                }
            }

            if (jogadorIndex === null) return; // Se jogador não foi encontrado na sala
            if (sala.jogadores[jogadorIndex].jogada != null) return // Se jogador já jogou
 

            salas[salaID].jogadores[jogadorIndex].jogada = escolha;
            jogaram++;

            io.emit("jogou", salaID, jogadorID)

            if (jogaram == 2 ) {
                io.emit("encerrouJogo", salaID, sala)
            }
        })

        socket.on('disconnect', () => {
            let idSala = null;

            for (const jogador of jogadores) { // Descobrir a sala do jogador que se desconectou.
                if (jogador.id == socket.id) {
                    idSala = jogador.sala
                }
            }

            if (idSala != null) {
                jogadorSaiu(idSala, socket.id)
            }
          });
        
    });
    
    function jogadorSaiu (idSala, idJogador) {
        const sala = salas[idSala];

        if (!sala) return;

        let indexJogador = null;  // Achar jogador na lista de jogadores ( do servidor )
        for (const index in jogadores) {
            if (jogadores[index].id === idJogador) {
                indexJogador = index;
            }
        }

        if (indexJogador === null) return; // Se jogador não existe, cancelar

        for (const index in sala.jogadores) { // Encontrar o jogador na sala com o id correspondente e removê-lo
            const jogadorSala = sala.jogadores[index];
            if (jogadorSala.id == idJogador) {
                salas[idSala].jogadores.splice(index, 1);
                break;
            }
        }
        
        jogadores[indexJogador].sala = null;

        io.emit('saiuSala', idJogador, idSala, salas[idSala])
    
        if (salas[idSala].jogadores.length < 1) { // Se não há mais jogadores na sala, deletá-la
            salas[idSala] = null;
        }
    }

    http.listen(8080, function() {
        console.log('Servidor rodando na porta 8080');
    });

})()

