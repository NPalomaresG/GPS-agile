const recorrido = document.querySelector('.recorrido');
const marco = recorrido.querySelector('.marco');
const pista = recorrido.querySelector('.pista');
const capitulos = [...pista.querySelectorAll('.capitulo')];
const nombres = capitulos.map(capitulo => capitulo.querySelector('.ceja').textContent.trim());
const ultimo = capitulos.length - 1;
const mandos = recorrido.querySelector('.mandos');
const progreso = mandos.querySelector('progress');
const numeroEscena = mandos.querySelector('.escena-numero');
const nombreEscena = mandos.querySelector('.escena-nombre');
const anterior = mandos.querySelector('.anterior-capitulo');
const siguiente = mandos.querySelector('.siguiente-capitulo');
const escritorio = matchMedia('(min-width: 1000px) and (min-height: 650px)');
const reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)');

let modo;
let activo = 0;
let viaje = 0;
let actualizacion = 0;

const limitar = (valor, maximo) => Math.max(0, Math.min(valor, maximo));
const dosDigitos = valor => String(valor).padStart(2, '0');

function actualizarRecorrido() {
  actualizacion = 0;
  const borde = recorrido.getBoundingClientRect().top;
  marco.classList.toggle('en-vista', borde < window.innerHeight * .65);
  let posicion;

  if (modo === 'lateral') {
    posicion = limitar((-borde / viaje) * ultimo, ultimo);
    pista.style.setProperty('--desplazamiento', `${-posicion * pista.clientWidth}px`);
  } else if (modo === 'tactil') {
    posicion = limitar(pista.scrollLeft / pista.clientWidth, ultimo);
  } else {
    const alFinal = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    const linea = window.innerHeight * .42;
    posicion = alFinal ? ultimo : Math.max(0,
      capitulos.findLastIndex(capitulo => capitulo.getBoundingClientRect().top <= linea));
  }

  progreso.value = posicion + 1;
  const nuevo = Math.round(posicion);
  const cambioCapitulo = activo !== nuevo;
  if (cambioCapitulo) {
    activo = nuevo;
    numeroEscena.textContent = `${dosDigitos(activo + 1)} / ${dosDigitos(capitulos.length)}`;
    nombreEscena.textContent = nombres[activo];
    anterior.setAttribute('aria-disabled', String(activo === 0));
    siguiente.setAttribute('aria-disabled', String(activo === ultimo));
  }

  capitulos.forEach((capitulo, indice) => {
    const oculto = modo !== 'vertical' && indice !== activo;
    if (capitulo.inert === oculto) return;
    if (oculto && capitulo.contains(document.activeElement)) marco.focus({ preventScroll: true });
    capitulo.inert = oculto;
  });

  if (modo === 'tactil') {
    const altura = capitulos[activo].offsetHeight;
    pista.style.setProperty('--altura-capitulo', `${altura}px`);
    if (cambioCapitulo && borde + altura < 96) {
      window.scrollTo({ top: Math.round(window.scrollY + borde), behavior: 'instant' });
    }
  }
}

function programarActualizacion() {
  if (!actualizacion) actualizacion = requestAnimationFrame(actualizarRecorrido);
}

function irAlCapitulo(indice) {
  if (indice < 0 || indice > ultimo) return;

  const inicio = window.scrollY + recorrido.getBoundingClientRect().top;
  if (modo === 'tactil') {
    pista.scrollTo({ left: indice * pista.clientWidth, behavior: 'instant' });
  }
  const destino = modo === 'vertical'
    ? window.scrollY + capitulos[indice].getBoundingClientRect().top
    : inicio + (modo === 'lateral' ? viaje * indice / ultimo : 0);

  window.scrollTo({ top: Math.round(destino), behavior: 'instant' });
  actualizarRecorrido();
}

function medirRecorrido() {
  const modoAnterior = modo;
  const estabaDentro = recorrido.getBoundingClientRect().top < window.innerHeight
    && recorrido.getBoundingClientRect().bottom > 0;
  modo = reducirMovimiento.matches ? 'vertical' : escritorio.matches ? 'lateral' : 'tactil';
  document.body.dataset.recorrido = modo;
  viaje = Math.max(500, marco.clientHeight * .9) * ultimo;
  recorrido.style.setProperty('--viaje', `${viaje}px`);

  if (modoAnterior && modoAnterior !== modo && estabaDentro) {
    irAlCapitulo(activo);
  } else {
    actualizarRecorrido();
  }
}

function capituloDelEnlace(hash) {
  return capitulos.findIndex(capitulo => `#${capitulo.id}` === hash);
}

function seguirAncla() {
  const indice = capituloDelEnlace(location.hash);
  if (indice >= 0) irAlCapitulo(indice);
}

document.querySelectorAll('a[href^="#"]').forEach(enlace => {
  const indice = capituloDelEnlace(enlace.hash);
  if (indice < 0) return;
  enlace.addEventListener('click', evento => {
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault();
    if (location.hash !== enlace.hash) history.pushState(null, '', enlace.hash);
    irAlCapitulo(indice);
    marco.focus({ preventScroll: true });
  });
});

anterior.addEventListener('click', () => irAlCapitulo(activo - 1));
siguiente.addEventListener('click', () => irAlCapitulo(activo + 1));

marco.addEventListener('keydown', evento => {
  if (evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
  if (evento.target.closest('select')) return;
  const avance = { ArrowLeft: -1, ArrowRight: 1 }[evento.key];
  if (!avance) return;
  evento.preventDefault();
  irAlCapitulo(activo + avance);
});

window.addEventListener('scroll', programarActualizacion, { passive: true });
pista.addEventListener('scroll', programarActualizacion, { passive: true });
window.addEventListener('resize', medirRecorrido);
reducirMovimiento.addEventListener('change', medirRecorrido);
window.addEventListener('hashchange', seguirAncla);

progreso.max = capitulos.length;
mandos.hidden = false;
medirRecorrido();
if (capituloDelEnlace(location.hash) >= 0) {
  seguirAncla();
  window.addEventListener('pageshow', () => requestAnimationFrame(seguirAncla), { once: true });
}
const observarAltura = new ResizeObserver(() => {
  if (modo === 'tactil') programarActualizacion();
});
capitulos.forEach(capitulo => observarAltura.observe(capitulo));

const temasAnimo = [
  {
    animo: 'calma', titulo: 'Sailor Song', artista: 'Gigi Perez',
    spotify: '2262bWmqomIaJXwCRHr13j', descripcion: 'Indie folk · Guitarra acústica y voz íntima.',
    imagen: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02e6065f209e0a01986206bd53',
  },
  {
    animo: 'impulso', titulo: 'Midnight City', artista: 'M83',
    spotify: '1eyzqe2QqGZUmfcPZtrIyt', descripcion: 'Electrónica · Sintetizadores y ritmos envolventes.',
    imagen: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0290e9adff5f77dd1ff6d24e47',
  },
  {
    animo: 'energia', titulo: 'Dog Days Are Over', artista: 'Florence + The Machine',
    spotify: '1YLJVmuzeM2YSUkCCaTNUB', descripcion: 'Indie rock · Percusión expansiva y voz potente.',
    imagen: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e020672b0f8756ae2af86e8a5ce',
  },
];

const canciones = [
  {
    titulo: 'Stop The Wedding!',
    artista: 'Ashe',
    spotify: '3zOYmiNOuyDL0ClxJcEJ0T',
    imagen: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e020893a0c33fd4b8497b0ef2f6',
  },
  {
    titulo: 'Patient Zero',
    artista: 'Taylor Swift',
    spotify: '11hcBLPtbMp4aQI6zGQLub',
    imagen: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02cf3de6b538d8b1ed73a4d5d1',
  },
  {
    titulo: 'Nicole Kidman',
    artista: 'ADÉLA',
    spotify: '70cHKK8bHAfJrOGVnfRG9J',
    imagen: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02ac9d5d5263e9f03802d6864c',
  },
  {
    titulo: 'Earrings',
    artista: 'Malcolm Todd',
    spotify: '0eAuGrXyGFYwur9ARUe7LJ',
    imagen: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e022c1f34ecc1929fb59908aad1',
  },
  ...temasAnimo,
];
const artistas = temasAnimo.map(tema => ({
  id: tema.spotify, imagen: tema.imagen, titulo: tema.artista, subtitulo: tema.descripcion, tema,
}));
const urlSpotify = tema => `https://open.spotify.com/track/${tema.spotify}`;
const embedSpotify = tema => `https://open.spotify.com/embed/track/${tema.spotify}`;
const uriSpotify = tema => `spotify:track:${tema.spotify}`;

function prepararMazo(escucha, tarjetas, tipo, clave, etiquetas, actualizarEnlace) {
  const tarjeta = escucha.querySelector('.tarjeta-deslizante');
  const portada = tarjeta.querySelector('.tarjeta-portada');
  const titulo = tarjeta.querySelector('h3');
  const subtitulo = tarjeta.querySelector('.tarjeta-subtitulo');
  const contador = tarjeta.querySelector('.tarjeta-numero');
  const enlace = tarjeta.querySelector('.tarjeta-enlace');
  const guardar = escucha.querySelector('.guardar');
  const aviso = escucha.querySelector('.aviso-mazo');
  const coleccion = escucha.querySelector('.guardados');
  const lista = coleccion.querySelector('ul');
  const resumen = coleccion.querySelector('summary');
  const nombreColeccion = resumen.textContent;
  const [accion, marcada, confirmada, retirada] = etiquetas;
  let guardadas = new Set();
  let actual = 0;
  let gesto;

  try {
    const ids = JSON.parse(localStorage.getItem(clave));
    if (Array.isArray(ids)) guardadas = new Set(ids.filter(id => tarjetas.some(tarjeta => tarjeta.id === id)));
  } catch {
    // Las tarjetas se pueden seguir usando con el almacenamiento bloqueado.
  }

  function actualizarBoton() {
    const guardada = guardadas.has(tarjetas[actual].id);
    guardar.setAttribute('aria-pressed', String(guardada));
    guardar.textContent = guardada ? marcada : accion;
  }

  function mostrar(indice) {
    if (actual !== indice) {
      actual = indice;
      const datos = tarjetas[actual];
      portada.src = datos.imagen;
      titulo.textContent = datos.titulo;
      subtitulo.textContent = datos.subtitulo;
      contador.textContent = `${dosDigitos(actual + 1)} / ${dosDigitos(tarjetas.length)}`;
      contador.setAttribute('aria-label', `${tipo} ${actual + 1} de ${tarjetas.length}`);
      actualizarEnlace(enlace, datos);
      actualizarBoton();
    }
    aviso.textContent = tarjetas[actual].titulo;
  }

  function actualizarColeccion() {
    const guardadasVisibles = tarjetas.flatMap(({ id, titulo: nombre }, indice) => {
      if (!guardadas.has(id)) return [];
      const fila = document.createElement('li');
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.textContent = nombre;
      boton.addEventListener('click', () => {
        mostrar(indice);
        guardar.focus();
      });
      fila.append(boton);
      return [fila];
    });
    lista.replaceChildren(...guardadasVisibles);
    resumen.textContent = `${nombreColeccion} (${guardadasVisibles.length})`;
    coleccion.hidden = guardadasVisibles.length === 0;
  }

  function marcar(guardada) {
    const { id, titulo: nombre } = tarjetas[actual];
    if (guardada) guardadas.add(id);
    else guardadas.delete(id);
    try {
      localStorage.setItem(clave, JSON.stringify([...guardadas]));
    } catch {
      // Se mantiene la selección durante la visita.
    }
    actualizarBoton();
    actualizarColeccion();
    return `«${nombre}» ${guardada ? confirmada : retirada}.`;
  }

  const pasar = () => mostrar((actual + 1) % tarjetas.length);
  guardar.addEventListener('click', () => { aviso.textContent = marcar(!guardadas.has(tarjetas[actual].id)); });
  escucha.querySelector('.siguiente-tarjeta').addEventListener('click', pasar);

  tarjeta.addEventListener('pointerdown', evento => {
    if (!evento.isPrimary || evento.button !== 0 || evento.target.closest('a')) return;
    gesto = { id: evento.pointerId, x: evento.clientX, y: evento.clientY };
    tarjeta.setPointerCapture(gesto.id);
  });

  tarjeta.addEventListener('pointermove', evento => {
    if (gesto?.id !== evento.pointerId) return;
    const x = evento.clientX - gesto.x;
    const y = evento.clientY - gesto.y;
    const arrastre = Math.abs(x) > Math.abs(y) ? Math.sign(x) * limitar(Math.abs(x) * .24, 22) : 0;
    tarjeta.style.setProperty('--arrastre', `${arrastre}px`);
  });

  function terminarGesto(evento) {
    if (gesto?.id !== evento.pointerId) return;
    const x = evento.clientX - gesto.x;
    const y = evento.clientY - gesto.y;
    gesto = undefined;
    tarjeta.style.removeProperty('--arrastre');
    if (evento.type !== 'pointerup' || Math.abs(x) < 48 || Math.abs(x) < Math.abs(y) * 1.25) return;
    const confirmacion = x > 0 ? marcar(true) : '';
    pasar();
    if (confirmacion) aviso.textContent = `${confirmacion} Ahora, ${tarjetas[actual].titulo}.`;
  }

  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(evento => {
    tarjeta.addEventListener(evento, terminarGesto);
  });
  actualizarBoton();
  actualizarColeccion();
  return mostrar;
}

const reproductor = document.querySelector('#descubrir .reproductor');
const mostrarCancion = prepararMazo(document.querySelector('#descubrir .escucha'), canciones.map(cancion => ({
  ...cancion, id: cancion.spotify, subtitulo: cancion.artista,
})), 'Canción', 'sinNombre.canciones', ['Guardar', 'Guardada', 'guardada', 'quitada de guardadas'],
  (enlace, cancion) => {
    enlace.href = urlSpotify(cancion);
    reproductor.title = `${cancion.titulo} en Spotify`;
    reproductor.src = embedSpotify(cancion);
  });

prepararMazo(document.querySelector('#artistas .escucha'), artistas, 'Artista', 'sinNombre.artistas',
  ['Seguir', 'Siguiendo', 'añadido a tus artistas', 'eliminado de tus artistas'], (enlace, artista) => {
    enlace.dataset.cancion = artista.tema.spotify;
    enlace.textContent = `Escuchar «${artista.tema.titulo}»`;
  });

document.querySelector('#artistas .tarjeta-enlace').addEventListener('click', evento => {
  if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
  const indice = canciones.findIndex(tema => tema.spotify === evento.currentTarget.dataset.cancion);
  mostrarCancion(indice);
  reproductor.focus({ preventScroll: true });
});

const animoActual = document.querySelector('#animo-actual');
const animoDestino = document.querySelector('#animo-destino');
const listaAnimo = document.querySelector('.cola-animo');
const marcoSpotify = document.querySelector('.reproductor-animo');
const enlaceAnimo = document.querySelector('.enlace-animo');
const avisoAnimo = document.querySelector('.aviso-animo');
let cola = [];
let temaActivo = 0;
let temaCargado;
let controladorAnimo;
let sonando = false;
let reproducirAlCargar = false;

function elegirTema(indice, escuchar) {
  temaActivo = indice;
  const tema = cola[indice];
  [...listaAnimo.querySelectorAll('button')].forEach((boton, posicion) => {
    if (posicion === indice) boton.setAttribute('aria-current', 'true');
    else boton.removeAttribute('aria-current');
  });
  enlaceAnimo.href = urlSpotify(tema);
  const iframe = marcoSpotify.querySelector('iframe');
  iframe.title = `${tema.titulo} en Spotify`;

  if (tema !== temaCargado) {
    temaCargado = tema;
    sonando = false;
    reproducirAlCargar = Boolean(controladorAnimo && escuchar);
    if (controladorAnimo) controladorAnimo.loadEntity(uriSpotify(tema));
    else if (iframe.src !== embedSpotify(tema)) iframe.src = embedSpotify(tema);
  }
  if (escuchar && !sonando) controladorAnimo?.play();
}

function ajustarCola(evento) {
  const estabaSonando = sonando || reproducirAlCargar;
  const temaAnterior = cola[temaActivo];
  const inicio = temasAnimo.findIndex(tema => tema.animo === animoActual.value);
  const destino = temasAnimo.findIndex(tema => tema.animo === animoDestino.value);
  cola = temasAnimo.slice(Math.min(inicio, destino), Math.max(inicio, destino) + 1);
  if (inicio > destino) cola.reverse();

  listaAnimo.replaceChildren(...cola.map((tema, indice) => {
    const fila = document.createElement('li');
    const boton = document.createElement('button');
    const estado = document.createElement('span');
    const animo = [...animoActual.options].find(opcion => opcion.value === tema.animo).textContent;
    boton.type = 'button';
    boton.textContent = tema.titulo;
    estado.textContent = animo;
    boton.append(estado);
    boton.addEventListener('click', () => elegirTema(indice, true));
    fila.append(boton);
    return fila;
  }));

  const continuar = estabaSonando && evento?.target === animoDestino;
  elegirTema(continuar ? Math.max(0, cola.indexOf(temaAnterior)) : 0, estabaSonando);
  avisoAnimo.textContent = `${cola.length} ${cola.length === 1 ? 'tema' : 'temas'} en la lista.`;
}

animoActual.addEventListener('change', ajustarCola);
animoDestino.addEventListener('change', ajustarCola);
ajustarCola();

window.onSpotifyIframeApiReady = api => {
  api.createController(marcoSpotify.querySelector('iframe'), { uri: uriSpotify(temaCargado), height: 152 }, controlador => {
    controladorAnimo = controlador;
    marcoSpotify.querySelector('iframe').title = `${temaCargado.titulo} en Spotify`;
    controlador.addListener('ready', () => {
      if (!reproducirAlCargar) return;
      reproducirAlCargar = false;
      controlador.play();
    });
    controlador.addListener('playback_update', ({ data }) => {
      const { playingURI, isPaused, isBuffering, position, duration } = data;
      if (playingURI && playingURI !== uriSpotify(temaCargado)) return;
      const final = !isBuffering && duration > 0 && position >= duration && (sonando || !isPaused);
      sonando = !isPaused && !final;
      if (sonando) reproducirAlCargar = false;
      if (!final) return;
      if (temaActivo + 1 < cola.length) elegirTema(temaActivo + 1, true);
      else avisoAnimo.textContent = 'Has llegado al final de la lista.';
    });
  });
};

const apiSpotify = document.createElement('script');
apiSpotify.src = 'https://open.spotify.com/embed/iframe-api/v1';
apiSpotify.async = true;
document.head.append(apiSpotify);
