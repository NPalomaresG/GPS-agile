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

const canciones = [
  {
    titulo: 'BbY WOW',
    artista: 'KAROL G, Judeline y rusowsky',
    spotify: '3h5T5JypYU7huFiVYhv1dr',
    imagen: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0221deb742375f88edfb2e7368',
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
];
const escucha = document.querySelector('.escucha');
const tarjeta = escucha.querySelector('.cancion');
const reproductor = escucha.querySelector('.reproductor');
const enlaceCancion = escucha.querySelector('.cancion-enlace');
const guardar = escucha.querySelector('.guardar');
const aviso = escucha.querySelector('.aviso-cancion');
const portada = escucha.querySelector('.cancion-portada');
const titulo = escucha.querySelector('#cancion-titulo');
const artista = escucha.querySelector('.cancion-artista');
const contador = escucha.querySelector('.cancion-numero');
const guardadas = new Set();
let cancion = 0;
let gesto;

function actualizarGuardado() {
  const guardada = guardadas.has(cancion);
  guardar.setAttribute('aria-pressed', String(guardada));
  guardar.textContent = guardada ? 'Guardada' : 'Guardar';
}

function marcarCancion(guardada = true) {
  if (guardada) guardadas.add(cancion);
  else guardadas.delete(cancion);
  actualizarGuardado();
  aviso.textContent = `«${canciones[cancion].titulo}» ${guardada ? 'guardada' : 'quitada de guardadas'}.`;
}

function pasarCancion() {
  cancion = (cancion + 1) % canciones.length;
  const { titulo: nombre, artista: grupo, imagen, spotify } = canciones[cancion];
  portada.src = imagen;
  titulo.textContent = nombre;
  artista.textContent = grupo;
  contador.textContent = `${dosDigitos(cancion + 1)} / ${dosDigitos(canciones.length)}`;
  contador.setAttribute('aria-label', `Canción ${cancion + 1} de ${canciones.length}`);
  enlaceCancion.href = `https://open.spotify.com/track/${spotify}`;
  reproductor.title = `${nombre} en Spotify`;
  reproductor.src = `https://open.spotify.com/embed/track/${spotify}`;
  actualizarGuardado();
  aviso.textContent = `${nombre}, de ${grupo}.`;
}

guardar.addEventListener('click', () => marcarCancion(!guardadas.has(cancion)));
escucha.querySelector('.siguiente-cancion').addEventListener('click', pasarCancion);

tarjeta.addEventListener('pointerdown', evento => {
  if (!evento.isPrimary || evento.button !== 0 || evento.target.closest('a, iframe')) return;
  gesto = { id: evento.pointerId, x: evento.clientX, y: evento.clientY };
  tarjeta.setPointerCapture(gesto.id);
});

tarjeta.addEventListener('pointermove', evento => {
  if (gesto?.id !== evento.pointerId) return;
  const x = evento.clientX - gesto.x;
  const y = evento.clientY - gesto.y;
  if (Math.abs(x) > Math.abs(y)) {
    tarjeta.style.setProperty('--arrastre', `${Math.sign(x) * limitar(Math.abs(x) * .24, 22)}px`);
  }
});

function terminarGesto(evento) {
  if (gesto?.id !== evento.pointerId) return;
  const x = evento.clientX - gesto.x;
  const y = evento.clientY - gesto.y;
  gesto = undefined;
  tarjeta.style.removeProperty('--arrastre');
  if (evento.type !== 'pointerup' || Math.abs(x) < 48 || Math.abs(x) < Math.abs(y) * 1.25) return;
  if (x > 0) marcarCancion();
  else pasarCancion();
}

['pointerup', 'pointercancel', 'lostpointercapture'].forEach(evento => {
  tarjeta.addEventListener(evento, terminarGesto);
});
