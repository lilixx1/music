
const $ = (seletor) => document.querySelector(seletor);

const formularioContainer = $("#formulario-container");
const formularioMusica = $("#formulario-musica");
const botaoAdicionar = $("#botao-adicionar");
const botaoCancelar = $("#botao-cancelar");

const campoNome = $("#nome-musica");
const campoArtista = $("#nome-artista");
const campoAlbum = $("#nome-album");
const campoImagem = $("#imagem-musica");
const campoLink = $("#link-musica");
const campoArquivo = $("#arquivo-musica");

const gradeMusicas = $("#grade-musicas");
const pesquisaMusicas = $("#pesquisa-musicas");
const filtroMusicas = $("#filtro-musicas");

const totalMusicas = $("#total-musicas");
const totalFavoritas = $("#total-favoritas");
const totalPlaylists = $("#total-playlists");

const formularioPlaylistContainer = $("#formulario-playlist-container");
const formularioPlaylist = $("#formulario-playlist");
const campoNomePlaylist = $("#nome-playlist");
const botaoPlaylist = $("#botao-playlist");
const cancelarPlaylist = $("#cancelar-playlist");
const gradePlaylists = $("#grade-playlists");

const audio = $("#audio-musica");
const playerTitulo = $("#player-titulo");
const playerArtista = $("#player-artista");
const capaPlayer = $("#capa-player");
const botaoReproduzir = $("#botao-reproduzir");
const botaoAnterior = $("#botao-anterior");
const botaoProxima = $("#botao-proxima");
const barraTempo = $("#barra-tempo");
const tempoAtual = $("#tempo-atual");
const duracaoMusica = $("#duracao-musica");

const CHAVE_MUSICAS = "myMusicRoomMusicas";
const CHAVE_PLAYLISTS = "myMusicRoomPlaylists";

let musicas = carregarDados(CHAVE_MUSICAS);
let playlists = carregarDados(CHAVE_PLAYLISTS);

let musicaAtualId = null;
let filaReproducao = [];
let urlTemporaria = null;

function carregarDados(chave) {
    try {
        const dados = JSON.parse(localStorage.getItem(chave));
        return Array.isArray(dados) ? dados : [];
    } catch {
        return [];
    }
}

function salvarDados() {
    localStorage.setItem(CHAVE_MUSICAS, JSON.stringify(musicas));
    localStorage.setItem(CHAVE_PLAYLISTS, JSON.stringify(playlists));
}

function criarId() {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    if (texto !== undefined) {
        elemento.textContent = texto;
    }

    return elemento;
}

function validarLink(valor) {
    if (!valor) return "";

    try {
        const url = new URL(valor);

        if (url.protocol === "https:" || url.protocol === "http:") {
            return url.href;
        }
    } catch {
        // Link inválido.
    }

    return "";
}

function formatarTempo(segundos) {
    if (!Number.isFinite(segundos) || segundos < 0) {
        return "0:00";
    }

    const minutos = Math.floor(segundos / 60);
    const resto = Math.floor(segundos % 60);

    return `${minutos}:${String(resto).padStart(2, "0")}`;
}

function mostrarResumo() {
    totalMusicas.textContent = musicas.length;

    totalFavoritas.textContent = musicas.filter(
        musica => musica.favorita
    ).length;

    totalPlaylists.textContent = playlists.length;
}

function mostrarMusicas() {
    gradeMusicas.replaceChildren();

    const busca = pesquisaMusicas.value.trim().toLocaleLowerCase("pt-BR");
    const apenasFavoritas = filtroMusicas.value === "favoritas";

    const resultado = musicas.filter(musica => {
        const texto = `${musica.nome} ${musica.artista} ${musica.album || ""}`
            .toLocaleLowerCase("pt-BR");

        return texto.includes(busca) &&
            (!apenasFavoritas || musica.favorita);
    });

    if (resultado.length === 0) {
        const vazio = criarElemento("div", "mensagem-vazia");
        vazio.appendChild(criarElemento("span", "", "☾"));

        vazio.appendChild(
            criarElemento(
                "h3",
                "",
                musicas.length === 0
                    ? "Seu pequeno universo musical"
                    : "Nenhuma música encontrada"
            )
        );

        vazio.appendChild(
            criarElemento(
                "p",
                "",
                musicas.length === 0
                    ? "Adicione uma música para começar."
                    : "Tente outro nome ou altere o filtro."
            )
        );

        gradeMusicas.appendChild(vazio);
        mostrarResumo();
        return;
    }

    resultado.forEach(musica => {
        const cartao = criarElemento("article", "cartao-musica");

        if (musica.imagem) {
            const imagem = document.createElement("img");
            imagem.className = "capa-musica";
            imagem.src = musica.imagem;
            imagem.alt = `Capa de ${musica.album || musica.nome}`;
            imagem.loading = "lazy";

            imagem.addEventListener("error", () => {
                imagem.hidden = true;
            });

            cartao.appendChild(imagem);
        } else {
            const capa = criarElemento("div", "capa-musica");
            capa.style.display = "flex";
            capa.style.alignItems = "center";
            capa.style.justifyContent = "center";
            capa.style.color = "#d35b73";
            capa.style.fontSize = "3rem";
            capa.textContent = "♫";
            cartao.appendChild(capa);
        }

        const conteudo = criarElemento("div", "conteudo-musica");

        conteudo.appendChild(criarElemento("h3", "", musica.nome));
        conteudo.appendChild(
            criarElemento("p", "artista-musica", musica.artista)
        );

        if (musica.album) {
            conteudo.appendChild(
                criarElemento("p", "album-musica", musica.album)
            );
        }

        const acoes = criarElemento("div", "acoes-musica");

        const tocar = criarElemento("button", "botao-tocar", "▶ Ouvir");
        tocar.type = "button";
        tocar.addEventListener("click", () => reproduzirMusica(musica.id));

        const favorita = criarElemento(
            "button",
            musica.favorita ? "botao-favoritar ativo" : "botao-favoritar",
            musica.favorita ? "♥ Favorita" : "♡ Favoritar"
        );

        favorita.type = "button";
        favorita.setAttribute(
            "aria-pressed",
            String(Boolean(musica.favorita))
        );

        favorita.addEventListener("click", () => {
            musica.favorita = !musica.favorita;
            salvarDados();
            mostrarMusicas();
        });

        const excluir = criarElemento(
            "button",
            "botao-excluir-musica",
            "Excluir"
        );

        excluir.type = "button";
        excluir.addEventListener("click", () => excluirMusica(musica.id));

        acoes.append(tocar, favorita, excluir);

        if (musica.link) {
            const link = criarElemento("a", "link-musica", "Abrir link ↗");
            link.href = musica.link;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.style.color = "#e58c9f";
            link.style.fontSize = "0.75rem";
            link.style.display = "inline-block";
            link.style.marginTop = "12px";
            conteudo.appendChild(link);
        }

        conteudo.appendChild(acoes);
        cartao.appendChild(conteudo);
        gradeMusicas.appendChild(cartao);
    });

    mostrarResumo();
}

function mostrarPlaylists() {
    gradePlaylists.replaceChildren();

    if (playlists.length === 0) {
        const vazio = criarElemento(
            "p",
            "mensagem-vazia",
            "Suas playlists aparecerão aqui. ♡"
        );

        gradePlaylists.appendChild(vazio);
        mostrarResumo();
        return;
    }

    playlists.forEach(playlist => {
        const cartao = criarElemento("article", "cartao-playlist");
        cartao.appendChild(criarElemento("div", "icone-playlist", "♫"));
        cartao.appendChild(criarElemento("h3", "", playlist.nome));

        const quantidade = playlist.musicas.length;
        cartao.appendChild(
            criarElemento(
                "p",
                "",
                `${quantidade} ${quantidade === 1 ? "música" : "músicas"}`
            )
        );

        const acoes = criarElemento("div", "acoes-playlist");

        const adicionar = criarElemento(
            "button",
            "",
            "Adicionar música"
        );

        adicionar.type = "button";
        adicionar.addEventListener("click", () => adicionarMusicaPlaylist(playlist));

        const ouvir = criarElemento("button", "", "Ouvir playlist");
        ouvir.type = "button";
        ouvir.addEventListener("click", () => ouvirPlaylist(playlist));

        const excluir = criarElemento("button", "", "Excluir");
        excluir.type = "button";
        excluir.addEventListener("click", () => {
            if (!confirm(`Excluir a playlist "${playlist.nome}"?`)) return;

            playlists = playlists.filter(item => item.id !== playlist.id);
            salvarDados();
            mostrarPlaylists();
        });

        acoes.append(adicionar, ouvir, excluir);
        cartao.appendChild(acoes);
        gradePlaylists.appendChild(cartao);
    });

    mostrarResumo();
}

function abrirFormulario() {
    formularioContainer.hidden = false;
    campoNome.focus();
}

function fecharFormulario() {
    formularioMusica.reset();
    formularioContainer.hidden = true;
}

botaoAdicionar.addEventListener("click", abrirFormulario);
botaoCancelar.addEventListener("click", fecharFormulario);

formularioMusica.addEventListener("submit", evento => {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const artista = campoArtista.value.trim();
    const album = campoAlbum.value.trim();
    const imagem = validarLink(campoImagem.value.trim());
    const link = validarLink(campoLink.value.trim());
    const arquivo = campoArquivo.files[0];

    if (!nome || !artista) {
        alert("Preencha o nome da música e o artista. ♡");
        return;
    }

    if (campoImagem.value.trim() && !imagem) {
        alert("O link da capa precisa ser um endereço HTTP ou HTTPS válido.");
        return;
    }

    if (campoLink.value.trim() && !link) {
        alert("O link da música precisa ser um endereço HTTP ou HTTPS válido.");
        return;
    }

    if (!arquivo && !link) {
        const continuar = confirm(
            "Você não adicionou um áudio nem um link. Deseja salvar a música mesmo assim?"
        );

        if (!continuar) return;
    }

    const musica = {
        id: criarId(),
        nome,
        artista,
        album,
        imagem,
        link,
        favorita: false,
        arquivoNome: arquivo ? arquivo.name : "",
        arquivoTipo: arquivo ? arquivo.type : "",
        arquivoData: "",
        origem: arquivo ? "arquivo" : link ? "link" : "nenhuma"
    };

    if (arquivo) {
        if (!arquivo.type.startsWith("audio/")) {
            alert("Selecione um arquivo de áudio válido.");
            return;
        }

        const leitor = new FileReader();

        leitor.onload = () => {
            musica.arquivoData = leitor.result;

            musicas.unshift(musica);

            try {
                salvarDados();
                mostrarMusicas();
                fecharFormulario();
            } catch {
                musicas = musicas.filter(item => item.id !== musica.id);

                alert(
                    "Esse arquivo é grande demais para o armazenamento local do navegador. Tente um arquivo menor."
                );
            }
        };

        leitor.onerror = () => {
            alert("Não consegui ler esse arquivo de áudio. Tente novamente.");
        };

        leitor.readAsDataURL(arquivo);
        return;
    }

    musicas.unshift(musica);

    try {
        salvarDados();
        mostrarMusicas();
        fecharFormulario();
    } catch {
        musicas = musicas.filter(item => item.id !== musica.id);
        alert("Não consegui salvar os dados no navegador. Tente novamente.");
    }
});

function excluirMusica(id) {
    const musica = musicas.find(item => item.id === id);
    if (!musica) return;

    if (!confirm(`Deseja excluir "${musica.nome}" da biblioteca?`)) {
        return;
    }

    if (musicaAtualId === id) {
        pararMusica();
    }

    musicas = musicas.filter(item => item.id !== id);

    playlists.forEach(playlist => {
        playlist.musicas = playlist.musicas.filter(
            musicaId => musicaId !== id
        );
    });

    salvarDados();
    mostrarMusicas();
    mostrarPlaylists();
}

function pararMusica() {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    if (urlTemporaria) {
        URL.revokeObjectURL(urlTemporaria);
        urlTemporaria = null;
    }

    musicaAtualId = null;
    filaReproducao = [];
    playerTitulo.textContent = "Nenhuma música selecionada";
    playerArtista.textContent = "Escolha uma música da biblioteca";
    capaPlayer.replaceChildren();
    capaPlayer.textContent = "♫";
    botaoReproduzir.textContent = "▶";
    barraTempo.value = 0;
    tempoAtual.textContent = "0:00";
    duracaoMusica.textContent = "0:00";
}

async function reproduzirMusica(id) {
    const musica = musicas.find(item => item.id === id);
    if (!musica) return;

    if (musicaAtualId === id && audio.src) {
        if (audio.paused) {
            try {
                await audio.play();
                botaoReproduzir.textContent = "Ⅱ";
            } catch {
                alert("Não consegui reproduzir essa música.");
            }
        } else {
            audio.pause();
            botaoReproduzir.textContent = "▶";
        }

        return;
    }

    if (!musica.arquivoData && !musica.link) {
        alert("Essa música não tem arquivo de áudio nem link cadastrado.");
        return;
    }

    if (urlTemporaria) {
        URL.revokeObjectURL(urlTemporaria);
        urlTemporaria = null;
    }

    audio.pause();

    if (musica.arquivoData) {
        audio.src = musica.arquivoData;
    } else {
        // Links de páginas (por exemplo, páginas do YouTube)
        // normalmente não são arquivos de áudio reproduzíveis pelo elemento audio.
        audio.src = musica.link;
    }

    musicaAtualId = id;
    filaReproducao = musicas.map(item => item.id);

    playerTitulo.textContent = musica.nome;
    playerArtista.textContent = musica.artista;

    capaPlayer.replaceChildren();

    if (musica.imagem) {
        const imagem = document.createElement("img");
        imagem.src = musica.imagem;
        imagem.alt = "";
        capaPlayer.appendChild(imagem);
    } else {
        capaPlayer.textContent = "♫";
    }

    try {
        await audio.play();
        botaoReproduzir.textContent = "Ⅱ";
    } catch {
        botaoReproduzir.textContent = "▶";

        if (musica.link) {
            alert(
                "Esse link pode ser uma página, e não um arquivo de áudio reproduzível. Use um arquivo de áudio ou um link direto compatível."
            );
        } else {
            alert("Não consegui reproduzir esse arquivo de áudio.");
        }
    }
}

botaoReproduzir.addEventListener("click", async () => {
    if (!musicaAtualId) {
        const primeiraMusica = musicas.find(
            musica => musica.arquivoData || musica.link
        );

        if (primeiraMusica) {
            await reproduzirMusica(primeiraMusica.id);
        } else {
            alert("Adicione uma música com áudio ou link primeiro. ♡");
        }

        return;
    }

    if (audio.paused) {
        try {
            await audio.play();
            botaoReproduzir.textContent = "Ⅱ";
        } catch {
            alert("Não consegui retomar a reprodução.");
        }
    } else {
        audio.pause();
        botaoReproduzir.textContent = "▶";
    }
});

function mudarMusica(direcao) {
    if (filaReproducao.length === 0) return;

    const indiceAtual = filaReproducao.indexOf(musicaAtualId);
    const inicio = indiceAtual < 0 ? 0 : indiceAtual;
    const proximoIndice =
        (inicio + direcao + filaReproducao.length) % filaReproducao.length;

    const id = filaReproducao[proximoIndice];

    reproduzirMusica(id);
}

botaoAnterior.addEventListener("click", () => mudarMusica(-1));
botaoProxima.addEventListener("click", () => mudarMusica(1));

audio.addEventListener("loadedmetadata", () => {
    barraTempo.max = Number.isFinite(audio.duration) ? audio.duration : 0;
    duracaoMusica.textContent = formatarTempo(audio.duration);
});

audio.addEventListener("timeupdate", () => {
    barraTempo.value = audio.currentTime || 0;
    tempoAtual.textContent = formatarTempo(audio.currentTime);
});

audio.addEventListener("play", () => {
    botaoReproduzir.textContent = "Ⅱ";
});

audio.addEventListener("pause", () => {
    botaoReproduzir.textContent = "▶";
});

audio.addEventListener("ended", () => {
    mudarMusica(1);
});

barraTempo.addEventListener("input", () => {
    if (Number.isFinite(audio.duration)) {
        audio.currentTime = Number(barraTempo.value);
    }
});

pesquisaMusicas.addEventListener("input", mostrarMusicas);
filtroMusicas.addEventListener("change", mostrarMusicas);

botaoPlaylist.addEventListener("click", () => {
    formularioPlaylistContainer.hidden = false;
    campoNomePlaylist.focus();
});

cancelarPlaylist.addEventListener("click", () => {
    formularioPlaylist.reset();
    formularioPlaylistContainer.hidden = true;
});

formularioPlaylist.addEventListener("submit", evento => {
    evento.preventDefault();

    const nome = campoNomePlaylist.value.trim();

    if (!nome) {
        alert("Dê um nome para sua playlist. ♡");
        return;
    }

    playlists.unshift({
        id: criarId(),
        nome,
        musicas: []
    });

    salvarDados();
    mostrarPlaylists();

    formularioPlaylist.reset();
    formularioPlaylistContainer.hidden = true;
});

function adicionarMusicaPlaylist(playlist) {
    if (musicas.length === 0) {
        alert("Adicione músicas à biblioteca primeiro.");
        return;
    }

    const disponiveis = musicas.filter(
        musica => !playlist.musicas.includes(musica.id)
    );

    if (disponiveis.length === 0) {
        alert("Todas as músicas da biblioteca já estão nessa playlist.");
        return;
    }

    const escolha = prompt(
        "Digite o número da música que deseja adicionar:\n\n" +
        disponiveis.map((musica, indice) =>
            `${indice + 1}. ${musica.nome} — ${musica.artista}`
        ).join("\n")
    );

    if (escolha === null) return;

    const indice = Number(escolha) - 1;

    if (
        !Number.isInteger(indice) ||
        indice < 0 ||
        indice >= disponiveis.length
    ) {
        alert("Número inválido. Tente novamente.");
        return;
    }

    playlist.musicas.push(disponiveis[indice].id);

    salvarDados();
    mostrarPlaylists();
}

function ouvirPlaylist(playlist) {
    if (playlist.musicas.length === 0) {
        alert("Essa playlist ainda está vazia. Adicione algumas músicas! ♡");
        return;
    }

    const musicaComAudio = playlist.musicas
        .map(id => musicas.find(musica => musica.id === id))
        .find(musica => musica && (musica.arquivoData || musica.link));

    if (!musicaComAudio) {
        alert("Essa playlist ainda não tem músicas com áudio ou links.");
        return;
    }

    filaReproducao = playlist.musicas.filter(id => {
        const musica = musicas.find(item => item.id === id);
        return musica && (musica.arquivoData || musica.link);
    });

    reproduzirMusica(musicaComAudio.id);
}

// Atualiza a interface ao abrir a página.
mostrarMusicas();
mostrarPlaylists();
fecharFormulario();
formularioPlaylistContainer.hidden = true;
