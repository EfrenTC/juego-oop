class Game {
  constructor() {
    this.container = document.getElementById("game-container");
    this.personaje = new Personaje();
    this.container.appendChild(this.personaje.element);

    this.monedas = [];
    this.enemigos = [];
    this.puntuacion = 0;

    // ✨ Estructura ampliada con límites específicos para cada nivel
    this.niveles = [
      { 
        fondo: "./assets/backgrounds/Background1.png", 
        sueloY: 590,
        limiteIzquierdo: 20,
        limiteDerecho: 1200  // Ajusta según tu fondo
      },
      { 
        fondo: "./assets/backgrounds/Background2.png", 
        sueloY: 540,
        limiteIzquierdo: 50,
        limiteDerecho: 1150
      },
      { 
        fondo: "./assets/backgrounds/Background3.png", 
        sueloY: 440,
        limiteIzquierdo: 30,
        limiteDerecho: 1100
      },
      { 
        fondo: "./assets/backgrounds/Background4.png", 
        sueloY: 490,
        limiteIzquierdo: 20,
        limiteDerecho: 1180
      },
      { 
        fondo: "./assets/backgrounds/Background5.png", 
        sueloY: 560,
        limiteIzquierdo: 0,
        limiteDerecho: 1250
      },
      { 
        fondo: "./assets/backgrounds/Background6.png", 
        sueloY: 635,
        limiteIzquierdo: 100,
        limiteDerecho: 1400  // Boss level - área más pequeña
      },
    ];

    this.nivelActual = 0;
    this.container.style.backgroundImage = this.niveles[this.nivelActual];

    this.crearEscenario();
    this.agregarEventos();
    this.crearEnemigos();
    this.loopJuego();

    this.audioFondo = new Audio("./assets/sounds/blasphemous1.m4a");
    this.audioFondo.loop = true;
    this.audioFondo.volume = 0.2;

    this.audioBoss = new Audio("./assets/sounds/blasphemous2.m4a");
    this.audioBoss.loop = true;
    this.audioBoss.volume = 0.2;
  }

  iniciarMusica() {
    this.audioFondo.play().catch(err => console.warn("Error al reproducir música:", err));
  }

  cambiarAMusicaBoss() {
    this.audioFondo.pause();
    this.audioFondo.currentTime = 0;
    this.audioBoss.play().catch(err => console.warn("Error al reproducir música del boss:", err));
  }

  // ✨ Método para obtener los límites del nivel actual
  getLimitesNivel() {
    const nivel = this.niveles[this.nivelActual];
    return {
      izquierdo: nivel.limiteIzquierdo,
      derecho: nivel.limiteDerecho
    };
  }

  // ✨ Método para validar si una posición X está dentro de los límites
  validarPosicionX(x, anchoPersonaje = 0) {
    const limites = this.getLimitesNivel();
    const posicionIzquierda = x;
    const posicionDerecha = x + anchoPersonaje;
    
    return posicionIzquierda >= limites.izquierdo && posicionDerecha <= limites.derecho;
  }

  crearEscenario() {
    // Ajustar fondo y suelo según el nivel actual
    const nivel = this.niveles[this.nivelActual];
    this.container.style.backgroundImage = `url(${nivel.fondo})`;
    this.personaje.posicionInicialY = nivel.sueloY;
    this.personaje.y = nivel.sueloY;
    
    // ✨ Ajustar posición inicial del personaje dentro de los límites
    const limites = this.getLimitesNivel();
    this.personaje.x = Math.max(limites.izquierdo, Math.min(this.personaje.x, limites.derecho - this.personaje.element.offsetWidth));
    
    this.personaje.actualizarPosicion();

    // Crear monedas dentro de los límites
    for (let i = 0; i < 5; i++) {
      const moneda = new Moneda();
      // ✨ Posicionar monedas dentro de los límites del nivel
      const limites = this.getLimitesNivel();
      moneda.x = limites.izquierdo + Math.random() * (limites.derecho - limites.izquierdo - 50);
      this.monedas.push(moneda);
      this.container.appendChild(moneda.element);
    }
  }

  agregarEventos() {
    window.addEventListener("keydown", (e) => {
      if (e.key === "x" || e.key === "X") {
        const estaAtacando = this.personaje.atacar();
        if (estaAtacando) {
          this.procesarAtaqueJugador();
        }
      } else {
        // ✨ Pasar los límites al método de movimiento
        const limites = this.getLimitesNivel();
        this.personaje.mover(e, limites);
        this.verificarCambioNivel();
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        this.personaje.detenerMovimiento();
      }
    });

    this.checkColisiones();
  }

  verificarCambioNivel() {
    const personajeRight = this.personaje.x + this.personaje.element.offsetWidth;
    const limites = this.getLimitesNivel();

    // ✨ Cambiar nivel solo cuando llegue al límite derecho del nivel actual
    if (personajeRight >= limites.derecho && this.nivelActual < this.niveles.length - 1) {
      this.nivelActual++;
      const sueloActual = this.niveles[this.nivelActual].sueloY;
      const nuevosLimites = this.getLimitesNivel();

      this.container.style.backgroundImage = `url('${this.niveles[this.nivelActual].fondo}')`;

      // ✨ Posicionar personaje en el límite izquierdo del nuevo nivel
      this.personaje.x = nuevosLimites.izquierdo + 10;
      this.personaje.y = sueloActual;
      this.personaje.posicionInicialY = sueloActual;
      this.personaje.actualizarPosicion();
      this.crearEnemigos();

      // Cambiar música si es el último nivel (boss)
      if (this.nivelActual === this.niveles.length - 1) {
        this.cambiarAMusicaBoss();
      }

      console.log(`Nivel cambiado a ${this.nivelActual}`);
      console.log(`Nuevos límites: ${nuevosLimites.izquierdo} - ${nuevosLimites.derecho}`);
    }
  }

  crearEnemigos() {
    const sueloY = this.niveles[this.nivelActual].sueloY;
    const limites = this.getLimitesNivel();

    // Limpia enemigos anteriores
    this.enemigos.forEach((enemigo) => enemigo.element.remove());
    this.enemigos = [];

    if (this.nivelActual === 5) {
      // ✨ Crear boss dentro de los límites del nivel
      const areaDisponible = limites.derecho - limites.izquierdo;
      const bossX = limites.izquierdo + (areaDisponible / 2) - 125; // Centrar boss (asumiendo 250px de ancho)
      const boss = new Boss(bossX, sueloY, this.personaje);

      this.enemigos.push(boss);
      this.container.appendChild(boss.element);

      console.log("Boss creado en nivel 5");
      console.log(`Posición del boss: x=${boss.x}, y=${boss.y}`);
      console.log(`Límites del nivel: ${limites.izquierdo} - ${limites.derecho}`);

      return;
    }

    // ✨ Para los demás niveles, generar enemigos dentro de los límites
    const cantidadEnemigos = 1 + this.nivelActual;
    const areaDisponible = limites.derecho - limites.izquierdo - 100; // Margen de seguridad

    for (let i = 0; i < cantidadEnemigos; i++) {
      const espacioEntreMedos = areaDisponible / cantidadEnemigos;
      const x = limites.izquierdo + 50 + (i * espacioEntreMedos) + (Math.random() * 50);
      
      // ✨ Asegurar que el enemigo no se salga de los límites
      const xFinal = Math.max(limites.izquierdo, Math.min(x, limites.derecho - 50));
      
      const enemigo = new Enemigo(xFinal, sueloY, this.personaje, this.nivelActual);
      this.enemigos.push(enemigo);
      this.container.appendChild(enemigo.element);
    }

    console.log("Total enemigos en este nivel:", this.enemigos.length);
    console.log(`Límites del nivel: ${limites.izquierdo} - ${limites.derecho}`);
  }

  loopJuego() {
    this.enemigos.forEach((enemigo, index) => {
      if (enemigo.vida > 0) {
        // ✨ Pasar límites a los enemigos para que respeten bordes
        const limites = this.getLimitesNivel();
        if (enemigo.update) {
          enemigo.update(limites); // Algunos enemigos pueden necesitar conocer los límites
        }

        if (enemigo.verificarColision && enemigo.verificarColision(this.personaje) && !this.personaje.invulnerable) {
          console.log("¡Enemigo toca al jugador!");
          this.personaje.recibirDaño(enemigo.dañoAtaque || 1);
        }

      } else {
        if (enemigo.morir) {
          enemigo.morir();
        }
        this.enemigos.splice(index, 1);
      }
    });

    requestAnimationFrame(() => this.loopJuego());
  }

  procesarAtaqueJugador() {
    const personajeRect = this.personaje.element.getBoundingClientRect();

    this.enemigos.forEach((enemigo, index) => {
      const enemigoRect = enemigo.element.getBoundingClientRect();

      const colisiona = !(
        personajeRect.right < enemigoRect.left ||
        personajeRect.left > enemigoRect.right ||
        personajeRect.bottom < enemigoRect.top ||
        personajeRect.top > enemigoRect.bottom
      );

      const direccionCorrecta =
        (this.personaje.direccion === 1 && enemigoRect.left >= personajeRect.left) ||
        (this.personaje.direccion === -1 && enemigoRect.left <= personajeRect.left);

      if (colisiona && direccionCorrecta) {
        enemigo.recibirDaño(this.personaje.dañoAtaque);
        console.log(`¡Golpe exitoso! Vida enemigo: ${enemigo.vida}`);

        const fuerzaEmpuje = 10;

        // ✨ Aplicar empuje respetando límites del nivel
        if (!(enemigo instanceof Boss)) {
          const nuevaX = enemigo.x + (this.personaje.direccion * fuerzaEmpuje);
          const limites = this.getLimitesNivel();
          
          // Asegurar que el empuje no saque al enemigo de los límites
          enemigo.x = Math.max(limites.izquierdo, Math.min(nuevaX, limites.derecho - enemigo.element.offsetWidth));
        }

        this.actualizarPuntuacion(5);

        if (enemigo.vida <= 0) {
          this.actualizarPuntuacion(50);
          console.log('¡Enemigo eliminado! +50 puntos');
        }
      }
    });
  }

  checkColisiones() {
    setInterval(() => {
      this.monedas.forEach((moneda, index) => {
        if (this.personaje.colisionaCon(moneda)) {
          this.container.removeChild(moneda.element);
          this.monedas.splice(index, 1);
          this.actualizarPuntuacion(10);
          this.personaje.curar(5);
        }
      });
    }, 100);
  }

  getEstadisticasJuego() {
    return {
      puntuacion: this.puntuacion,
      vidaJugador: this.personaje.vida,
      enemigosVivos: this.enemigos.filter(e => e.vida > 0).length,
      monedasRestantes: this.monedas.length,
      limitesNivel: this.getLimitesNivel() // ✨ Información adicional
    };
  }

  actualizarPuntuacion(puntos) {
    this.puntuacion += puntos;
    console.log(`Puntuación: ${this.puntuacion}`);
  }
}



class Personaje {
  constructor() {
    this.x = 100;
    this.posicionInicialY = 0;
    this.y = this.posicionInicialY;
    this.width = 100;
    this.height = 100;
    this.velocidad = 15;
    this.saltando = false;
    this.direccion = 1;
    this.animando = false;
    this.atacando = false;
    this.moviendo = false;

    this.sonidoPasos = new Audio("./assets/sounds/Pasos1.ogg");
    this.sonidoPasos.loop = true; // Reproduce en bucle mientras se mueve
    this.sonidoPasos.volume = 0.4; // Opcional: ajusta volumen

    this.sonidoMuerte = new Audio("./assets/sounds/Playerdie.m4a");
    this.sonidoMuerte.volume = 0.6; // Ajusta volumen si quieres



    // Sistema de vida y combate
    this.vida = 150;
    this.vidaMaxima = 150;
    this.dañoAtaque = 25;
    this.invulnerable = false;
    this.tiempoInvulnerabilidad = 1000; // 1 segundo

    this.element = document.createElement("div");
    this.element.classList.add("personaje", "grande");

    this.actualizarPosicion();
    this.crearBarraVida();
  }

  crearBarraVida() {
    // Crear contenedor de la barra de vida
    this.barraVidaContainer = document.createElement("div");
    this.barraVidaContainer.classList.add("barra-vida-container");

    this.barraVida = document.createElement("div");
    this.barraVida.classList.add("barra-vida");

    this.barraVidaContainer.appendChild(this.barraVida);
    document.body.appendChild(this.barraVidaContainer);

    this.actualizarBarraVida();
  }

  actualizarBarraVida() {
    const porcentajeVida = (this.vida / this.vidaMaxima) * 100;
    this.barraVida.style.width = `${porcentajeVida}%`;

    // Cambiar color según la vida
    if (porcentajeVida > 60) {
      this.barraVida.style.backgroundColor = '#FF0000';
    } else if (porcentajeVida > 30) {
      this.barraVida.style.backgroundColor = '#BD3039';
    } else {
      this.barraVida.style.backgroundColor = '#8B0000';
    }
  }

 // En tu clase Personaje, modifica el método mover:

mover(evento, limites = null) {
  if (this.atacando) return;

  let movimiento = false;

  if (evento.key === "ArrowRight") {
    // ✨ Verificar límite derecho antes de mover
    const nuevaX = this.x + this.velocidad;
    const anchoPersonaje = this.element.offsetWidth || 50;
    
    if (!limites || (nuevaX + anchoPersonaje <= limites.derecho)) {
      this.x = nuevaX;
      
      if (this.direccion !== 1) {
        this.direccion = 1;
        this.element.style.transform = "scale(2) scaleX(1)";
      }
      this.iniciarAnimacionCaminar();
      movimiento = true;
    } else {
      // Si toca el límite, ajustar a la posición exacta del borde
      this.x = limites.derecho - anchoPersonaje;
      console.log("¡Límite derecho alcanzado!");
    }

  } else if (evento.key === "ArrowLeft") {
    // ✨ Verificar límite izquierdo antes de mover
    const nuevaX = this.x - this.velocidad;
    
    if (!limites || (nuevaX >= limites.izquierdo)) {
      this.x = nuevaX;
      
      if (this.direccion !== -1) {
        this.direccion = -1;
        this.element.style.transform = "scale(2) scaleX(-1)";
      }
      this.iniciarAnimacionCaminar();
      movimiento = true;
    } else {
      // Si toca el límite, ajustar a la posición exacta del borde
      this.x = limites.izquierdo;
      console.log("¡Límite izquierdo alcanzado!");
    }

  } else if (evento.key === "ArrowUp" && !this.saltando) {
    this.saltar();
  }

  // Iniciar sonido de pasos si hay movimiento
  if (movimiento && this.sonidoPasos.paused) {
    this.sonidoPasos.play().catch(() => { });
  }

  this.moviendo = movimiento;
  this.actualizarPosicion();
}

// ✨ Método auxiliar para verificar si está en los límites (opcional)
estaEnLimites(limites) {
  if (!limites) return true;
  
  const anchoPersonaje = this.element.offsetWidth || 50;
  return this.x >= limites.izquierdo && (this.x + anchoPersonaje) <= limites.derecho;
}

// ✨ Método para ajustar posición si está fuera de límites (útil para teleports o empujones)
ajustarALimites(limites) {
  if (!limites) return;
  
  const anchoPersonaje = this.element.offsetWidth || 50;
  
  if (this.x < limites.izquierdo) {
    this.x = limites.izquierdo;
  } else if (this.x + anchoPersonaje > limites.derecho) {
    this.x = limites.derecho - anchoPersonaje;
  }
  
  this.actualizarPosicion();
}

  detenerMovimiento() {
    this.moviendo = false;
    this.element.classList.remove("animar-caminar");
    this.element.style.backgroundImage = "url('./assets/Idle.png')";

    // Detener sonido de pasos
    this.sonidoPasos.pause();
    this.sonidoPasos.currentTime = 0;
  }



  iniciarAnimacionCaminar() {
    if (!this.element.classList.contains("animar-caminar")) {
      this.element.style.backgroundImage = "url('./assets/Run.png')";
      this.element.classList.add("animar-caminar");
    }
  }

  detenerAnimacion() {
    this.moviendo = false;
    this.element.classList.remove("animar-caminar");
    this.element.style.backgroundImage = "url('./assets/Idle.png')";
  }

  saltar() {
    if (this.saltando) return;

    this.saltando = true;
    this.element.classList.remove("animar-caminar");
    this.element.style.backgroundImage = "url('./assets/Jump.png')";

    const alturaMaxima = this.y - 200;

    const salto = setInterval(() => {
      if (this.y > alturaMaxima) {
        this.y -= 15;
      } else {
        clearInterval(salto);
        this.caer(); // empieza la caída cuando alcanza altura máxima
      }
      this.actualizarPosicion();
    }, 20);
  }

  caer() {
    const gravedad = setInterval(() => {
      if (this.y < this.posicionInicialY) {
        this.y += 10;
      } else {
        clearInterval(gravedad);
        this.saltando = false;
        this.y = this.posicionInicialY;

        if (this.moviendo) {
          this.element.style.backgroundImage = "url('./assets/Idle.png')";
          this.element.classList.add("animar-caminar");
        } else {
          this.element.style.backgroundImage = "url('./assets/Idle.png')";
        }
      }
      this.actualizarPosicion();
    }, 20);
  }


atacar() {
  if (this.atacando || this.saltando) return;
  this.atacando = true;
  this.moviendo = false;

  this.element.classList.remove("animar-caminar");
  this.element.style.backgroundImage = "url('./assets/Attacks.png')";
  this.element.classList.add("atacando");

  const ataqueAudio = new Audio('./assets/sounds/AtaqueEspada1.ogg');
  ataqueAudio.play();

  const totalFrames = 16; // Solo primeros 16 frames para ataque 1
  const columnas = 8;
  const anchoFrame = 128;
  const altoFrame = 64;
  let frameActual = 0;

  const frameDuration = 30; // ms, baja a 20 para animar más rápido

  const animarAtaque = setInterval(() => {
    if (frameActual >= totalFrames) {
      clearInterval(animarAtaque);
      this.atacando = false;
      this.element.classList.remove("atacando");

      // Volver al estado correspondiente
      if (this.saltando) {
        this.element.style.backgroundImage = "url('./assets/Jump.png')";
      } else if (this.moviendo) {
        this.element.style.backgroundImage = "url('./assets/Run.png')";
        this.element.classList.add("animar-caminar");
      } else {
        this.element.style.backgroundImage = "url('./assets/Idle.png')";
      }

      this.element.style.backgroundPosition = '0px 0px'; // Reiniciar por si acaso
      return;
    }

    const columna = frameActual % columnas;
    const fila = Math.floor(frameActual / columnas);

    const posX = -columna * anchoFrame;
    const posY = -fila * altoFrame;

    this.element.style.backgroundPosition = `${posX}px ${posY}px`;

    frameActual++;
  }, frameDuration);

  return true;
}


  recibirDaño(cantidad) {
    if (this.invulnerable || this.vida <= 0) return;

    this.vida -= cantidad;
    this.vida = Math.max(0, this.vida);

    console.log(`¡Jugador recibe ${cantidad} de daño! Vida restante: ${this.vida}`);

    // Solo brillo simple sin hue-rotate ni clase 'dañado'
    this.element.style.filter = 'brightness(2)';

    // Período de invulnerabilidad
    this.invulnerable = true;
    this.element.style.opacity = '0.5';

    setTimeout(() => {
      this.element.style.filter = 'brightness(1)';
      // No quitamos clase 'dañado' porque no la añadimos
      this.element.style.opacity = '1';
      this.invulnerable = false;
    }, this.tiempoInvulnerabilidad);

    this.actualizarBarraVida();

    if (this.vida <= 0) {
      this.morir();
    }
  }


  curar(cantidad) {
    this.vida += cantidad;
    this.vida = Math.min(this.vidaMaxima, this.vida); // No superar el máximo
    this.actualizarBarraVida();
    console.log(`¡Jugador se cura ${cantidad} puntos! Vida actual: ${this.vida}`);
  }

  morir() {
    console.log('¡Game Over!');
    this.element.style.filter = 'grayscale(1) brightness(0.5)';

    // Reproducir sonido de muerte
    this.sonidoMuerte.currentTime = 0;
    this.sonidoMuerte.play();

    setTimeout(() => {
      alert('¡Has muerto! Reiniciando...');
      this.reiniciar();
    }, 1000);
  }


  reiniciar() {
    this.vida = this.vidaMaxima;
    this.x = 100;
    this.y = this.posicionInicialY;
    this.invulnerable = false;
    this.element.style.filter = 'none';
    this.element.style.opacity = '1';
    this.actualizarPosicion();
    this.actualizarBarraVida();
  }

  actualizarPosicion() {
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
  }

  colisionaCon(objeto) {
    return (
      this.x < objeto.x + objeto.width &&
      this.x + this.width > objeto.x &&
      this.y < objeto.y + objeto.height &&
      this.y + this.height > objeto.y
    );
  }
}

class Enemigo {
  constructor(x, y, jugador) {
    this.x = x;
    this.width = 384;   // Aumentado de 256 a 384
    this.height = 480;  // Aumentado de 320 a 480

    this.y = (typeof y === 'number') ? (y - this.height + 225) : 100; // Ajustado offset

    this.velocidad = 0.3;
    this.direccion = -1;
    this.jugador = jugador;
    this.estado = 'patrullando';
    this.rangoDeteccion = 200; // Aumentado proporcionalmente
    this.rangoAtaque = 130;    // Aumentado proporcionalmente
    this.vida = 100;
    this.dañoAtaque = 8;
    this.tiempoUltimoAtaque = 0;
    this.cooldownAtaque = 2000;

    this.puntoInicialX = x;
    this.rangoPatrullaje = 100;
    this.limiteIzquierdo = Math.max(0, x - this.rangoPatrullaje / 2);
    this.limiteDerecho = Math.min(window.innerWidth - this.width, x + this.rangoPatrullaje / 2);

    this.element = document.createElement("div");
    this.element.classList.add("enemigo");
    document.body.appendChild(this.element);

    // ✨ Estado de animación para evitar conflictos
    this.animacionActual = 'idle';
    this.atacando = false;

    this.actualizarPosicion();
    this.element.style.transform = `scaleX(${this.direccion})`;
    this.sonidoAtaque = new Audio('./assets/sounds/Enemigo.ogg');
    this.sonidoMuerte = new Audio('./assets/sounds/EnemyDie.ogg');

    // ✨ Inicializar con sprite idle
    this.cambiarSprite('idle');
  }

  actualizarPosicion() {
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
  }

  // ✨ Método para cambiar sprites sin conflictos
  cambiarSprite(nuevoSprite) {
    if (this.animacionActual === nuevoSprite) return; // No cambiar si ya está activo

    // Limpiar todas las clases de animación
    this.element.classList.remove('animar-run', 'animar-atacar', 'animar-morir');

    switch (nuevoSprite) {
      case 'idle':
        this.element.style.backgroundImage = "url('./assets/enemy/Sprites/Idle.png')";
        this.element.style.backgroundSize = "3072px 480px"; // Ajustado: 8 frames * 384px
        this.element.style.backgroundPosition = "0 0";
        break;
      
      case 'run':
        this.element.style.backgroundImage = "url('./assets/enemy/Sprites/Run.png')";
        this.element.style.backgroundSize = "3072px 480px"; // Ajustado para nuevo tamaño
        this.element.classList.add('animar-run');
        break;
      
      case 'attack':
        this.element.style.backgroundImage = "url('./assets/enemy/Sprites/Attack1.png')";
        this.element.style.backgroundSize = "3072px 480px"; // 8 frames * 384px
        this.element.classList.add('animar-atacar');
        break;
      
      case 'death':
        this.element.style.backgroundImage = "url('./assets/enemy/Sprites/Death.png')";
        this.element.style.backgroundSize = "2304px 480px"; // 6 frames * 384px
        this.element.classList.add('animar-morir');
        break;
    }

    this.animacionActual = nuevoSprite;
  }

  // Resto de métodos permanecen igual...
  update(limites = null) {
    if (limites) {
      this.limiteIzquierdo = Math.max(limites.izquierdo, this.puntoInicialX - this.rangoPatrullaje / 2);
      this.limiteDerecho = Math.min(limites.derecho - this.width, this.puntoInicialX + this.rangoPatrullaje / 2);
    }

    this.actualizarEstado();
    this.mover();
    this.verificarColisiones();
    this.actualizarPosicion();
  }

  actualizarEstado() {
    const distanciaAlJugador = Math.abs(this.x - this.jugador.x);

    if (distanciaAlJugador <= this.rangoAtaque) {
      this.estado = 'atacando';
    } else if (distanciaAlJugador <= this.rangoDeteccion) {
      this.estado = 'persiguiendo';
    } else {
      this.estado = 'patrullando';
    }
  }

  mover() {
    switch (this.estado) {
      case 'patrullando':
        this.patrullar();
        break;
      case 'persiguiendo':
        this.perseguir();
        break;
      case 'atacando':
        this.atacar();
        break;
    }
  }

  patrullar() {
    if (this.atacando) return;

    this.cambiarSprite('run');

    this.x += this.velocidad * this.direccion;

    if (this.x <= this.limiteIzquierdo || this.x >= this.limiteDerecho) {
      this.direccion *= -1;
      this.element.style.transform = `scaleX(${this.direccion})`;
    }
  }

  perseguir() {
    if (this.atacando) return;

    this.cambiarSprite('run');

    const velocidadPersecucion = this.velocidad * 1.8;

    if (this.x < this.jugador.x) {
      this.x += velocidadPersecucion;
      if (this.direccion !== 1) {
        this.direccion = 1;
        this.element.style.transform = `scaleX(${this.direccion})`;
      }
    } else {
      this.x -= velocidadPersecucion;
      if (this.direccion !== -1) {
        this.direccion = -1;
        this.element.style.transform = `scaleX(${this.direccion})`;
      }
    }
  }

  atacar() {
    if (this.atacando) return;

    const tiempoActual = Date.now();

    if (tiempoActual - this.tiempoUltimoAtaque >= this.cooldownAtaque) {
      this.atacando = true;
      
      this.cambiarSprite('attack');
      
      this.realizarAtaque();
      this.tiempoUltimoAtaque = tiempoActual;

      this.sonidoAtaque.currentTime = 0;
      this.sonidoAtaque.play();

      setTimeout(() => {
        this.atacando = false;
        this.cambiarSprite('idle');
      }, 400);
    }

    const direccionAlJugador = this.x < this.jugador.x ? 1 : -1;
    if (this.direccion !== direccionAlJugador) {
      this.direccion = direccionAlJugador;
      this.element.style.transform = `scaleX(${this.direccion})`;
    }
  }

  realizarAtaque() {
    this.element.style.filter = 'brightness(1.5)';
    setTimeout(() => {
      this.element.style.filter = 'brightness(1)';
    }, 200);

    const distancia = Math.abs(this.x - this.jugador.x);
    if (distancia <= this.rangoAtaque) {
      this.jugador.recibirDaño(this.dañoAtaque);
      console.log(`¡Enemigo ataca! Jugador recibe ${this.dañoAtaque} de daño`);
    }
  }

  recibirDaño(cantidad) {
    this.vida -= cantidad;

    this.element.style.filter = 'brightness(2) hue-rotate(0deg)';
    setTimeout(() => {
      this.element.style.filter = 'brightness(1)';
    }, 150);

    if (this.vida <= 0) {
      this.morir();
    }
  }

  morir() {
    this.estado = 'muerto';
    this.atacando = false;
    
    this.cambiarSprite('death');

    this.sonidoMuerte.currentTime = 0;
    this.sonidoMuerte.play();

    setTimeout(() => {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }, 800);
  }

  verificarColisiones() {
    if (this.colisionaCon(this.jugador)) {
      const fuerzaEmpuje = 7; // Aumentado por el tamaño mayor
      if (this.x < this.jugador.x) {
        this.jugador.x += fuerzaEmpuje;
      } else {
        this.jugador.x -= fuerzaEmpuje;
      }
    }
  }

  colisionaCon(objeto) {
    return (
      this.x < objeto.x + objeto.width &&
      this.x + this.width > objeto.x &&
      this.y < objeto.y + objeto.height &&
      this.y + this.height > objeto.y
    );
  }

  verificarColision(jugador) {
    const distancia = Math.abs(this.x - jugador.x);
    const distanciaY = Math.abs(this.y - jugador.y);
    
    return distancia < 75 && distanciaY < 75; // Aumentado por el tamaño mayor
  }
}


class Boss extends Enemigo {
  constructor(x, y, jugador) {
    super(x, y, jugador);

    this.jugador = jugador;

    this.x = x;
    this.width = 500;
    this.height = 700;

    this.vida = 300;
    this.dañoAtaque = 3;
    this.velocidad = 0.5;
    this.rangoDeteccion = 600;
    this.rangoAtaque = 150;
    this.cooldownAtaque = 2000;
    this.tiempoUltimoAtaque = 0;

    this.estado = 'vivo';
    this.atacando = false;

    this.idleFrames = 8;
    this.walkFrames = 8;
    this.attackFrames = 10;

    this.currentIdleFrame = 1;
    this.currentWalkFrame = 1;

    this.idleAnimationSpeed = 150;
    this.walkAnimationSpeed = 120;

    this.idleInterval = null;
    this.walkInterval = null;

    this.element.classList.remove('enemigo');
    this.element.classList.add('boss');

    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;
    this.element.style.transformOrigin = "center bottom";
    this.element.style.imageRendering = "pixelated";

    if (typeof y === 'number') {
      this.y = y - this.height + 70;
      if (this.y < 0) this.y = 20;
    } else {
      this.y = Math.max(20, window.innerHeight - this.height - 50);
    }

    document.body.appendChild(this.element);
    this.actualizarPosicion();

    this.sonidoAtaque = new Audio('./assets/sounds/Bossgolpe.ogg');
    this.sonidoMuerteBoss = new Audio("./assets/sounds/BossDie.m4a");
    this.sonidoMuerteBoss.volume = 0.2;
    this.musicaBoss = new Audio("./assets/sounds/blasphemous2.m4a");
    this.musicaBoss.loop = true;
    this.musicaBoss.volume = 0.7;
    this.musicaBoss.play().catch(e => console.log("No se pudo reproducir música automáticamente:", e));

    this.preloadImages()
      .then(() => {
        this.iniciarAnimacionIdle();
        console.log("Boss cargado y listo");
      })
      .catch(error => {
        console.error("Error cargando imágenes del boss:", error);
      });
  }

  async preloadImages() {
    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(`Error cargando: ${src}`);
        img.src = src;
      });

    const promesas = [];

    for (let i = 1; i <= this.idleFrames; i++) {
      promesas.push(loadImage(`./assets/Boss/Individual Sprite/Idle/Bringer-of-Death_Idle_${i}.png`));
    }

    for (let i = 1; i <= this.attackFrames; i++) {
      promesas.push(loadImage(`./assets/Boss/Individual Sprite/Attack/Bringer-of-Death_Attack_${i}.png`));
    }

    for (let i = 1; i <= 10; i++) {
      promesas.push(loadImage(`./assets/Boss/Individual Sprite/Death/Bringer-of-Death_Death_${i}.png`));
    }

    for (let i = 1; i <= this.walkFrames; i++) {
      promesas.push(loadImage(`./assets/Boss/Individual Sprite/Walk/Bringer-of-Death_Walk_${i}.png`));
    }

    await Promise.all(promesas);
  }

  iniciarAnimacionIdle() {
    this.limpiarAnimaciones();

    if (this.estado !== 'vivo' || this.atacando) return;

    this.currentIdleFrame = 1;
    this.element.style.backgroundImage = `url('./assets/Boss/Individual Sprite/Idle/Bringer-of-Death_Idle_${this.currentIdleFrame}.png')`;

    this.idleInterval = setInterval(() => {
      if (this.estado !== 'vivo' || this.atacando) {
        this.limpiarAnimaciones();
        return;
      }
      this.currentIdleFrame = (this.currentIdleFrame % this.idleFrames) + 1;
      this.element.style.backgroundImage = `url('./assets/Boss/Individual Sprite/Idle/Bringer-of-Death_Idle_${this.currentIdleFrame}.png')`;
    }, this.idleAnimationSpeed);
  }

  iniciarAnimacionCaminata() {
    this.limpiarAnimaciones();

    this.currentWalkFrame = 1;
    this.element.style.backgroundImage = `url('./assets/Boss/Individual Sprite/Walk/Bringer-of-Death_Walk_${this.currentWalkFrame}.png')`;

    this.walkInterval = setInterval(() => {
      if (this.estado !== 'vivo' || this.atacando) {
        this.limpiarAnimaciones();
        return;
      }
      this.currentWalkFrame = (this.currentWalkFrame % this.walkFrames) + 1;
      this.element.style.backgroundImage = `url('./assets/Boss/Individual Sprite/Walk/Bringer-of-Death_Walk_${this.currentWalkFrame}.png')`;
    }, this.walkAnimationSpeed);
  }

  limpiarAnimaciones() {
    clearInterval(this.idleInterval);
    clearInterval(this.walkInterval);
    this.idleInterval = null;
    this.walkInterval = null;
  }

  verificarColision(jugador) {
    // Si el boss no está atacando, no hay colisión peligrosa
    if (!this.atacando) return false;

    const jugadorRect = {
      x: jugador.x,
      y: jugador.y,
      width: jugador.width || 64,
      height: jugador.height || 64,
    };

    const hitboxMarginX = 100; // más estrecho pero no tanto
    const hitboxHeight = 180;  // altura visible del cuerpo del boss
    const hitboxY = this.y + this.height - hitboxHeight; // parte baja del boss

    const bossHitbox = {
      x: this.x + hitboxMarginX,
      y: hitboxY,
      width: this.width - hitboxMarginX * 2,
      height: hitboxHeight,
    };

    const colision = (
      jugadorRect.x < bossHitbox.x + bossHitbox.width &&
      jugadorRect.x + jugadorRect.width > bossHitbox.x &&
      jugadorRect.y < bossHitbox.y + bossHitbox.height &&
      jugadorRect.y + jugadorRect.height > bossHitbox.y
    );

    console.log("Colisión jugador-boss:", colision, jugadorRect, bossHitbox);
    return colision;
  }




  update() {
    if (this.estado === 'muerto') return;

    const jugadorCentroX = this.jugador.x + (this.jugador.width || 64) / 2;
    const bossCentroX = this.x + this.width / 2;

    this.element.style.transform = jugadorCentroX < bossCentroX ? "scaleX(1)" : "scaleX(-1)";

    const distanciaX = jugadorCentroX - bossCentroX;
    const distanciaY = Math.abs(this.jugador.y - this.y);
    const enRangoX = Math.abs(distanciaX) <= this.rangoAtaque;
    const enRangoY = distanciaY < this.height;

    if (enRangoX && enRangoY) {
      this.atacar();
    } else if (Math.abs(distanciaX) <= this.rangoDeteccion) {
      // Moverse hacia el jugador
      this.x += distanciaX > 0 ? this.velocidad : -this.velocidad;
      this.actualizarPosicion();
      if (!this.walkInterval) this.iniciarAnimacionCaminata();
    } else {
      if (!this.idleInterval) this.iniciarAnimacionIdle();
    }
  }

  atacar() {
    if (this.atacando || this.estado === 'muerto') return;

    const ahora = Date.now();
    if (ahora - this.tiempoUltimoAtaque < this.cooldownAtaque) return;

    this.atacando = true;
    this.tiempoUltimoAtaque = ahora;

    this.limpiarAnimaciones();

    let frame = 1;
    const duracionFrame = 100;

    const animarAtaque = () => {
      if (frame > this.attackFrames) {
        this.atacando = false;
        this.iniciarAnimacionIdle();
        return;
      }

      this.element.style.backgroundImage = `url('./assets/Boss/Individual Sprite/Attack/Bringer-of-Death_Attack_${frame}.png')`;

      if (frame === 5) {
        this.realizarAtaque();
        this.sonidoAtaque.currentTime = 0;
        this.sonidoAtaque.play().catch(e => console.log("No se pudo reproducir sonido de ataque:", e));
      }

      frame++;
      setTimeout(animarAtaque, duracionFrame);
    };

    animarAtaque();
  }

  realizarAtaque() {
    if (this.verificarColision(this.jugador)) {
      this.jugador.recibirDaño(this.dañoAtaque);
      console.log("Boss atacó al jugador!");
    }
  }

  morir() {
    if (this.estado === 'muerto') return;

    this.estado = 'muerto';
    this.atacando = false;

    this.limpiarAnimaciones();
    this.musicaBoss.pause();

    this.sonidoMuerteBoss.currentTime = 0;
    this.sonidoMuerteBoss.play().catch(e => console.log("No se pudo reproducir sonido de muerte:", e));

    console.log("Boss: iniciando animación de muerte");

    let frame = 1;
    const deathFrames = 10;
    const duracionFrame = 200;

    const animarMuerte = () => {
      if (frame > deathFrames) {
        if (this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
        console.log("Boss derrotado, ¡has ganado el juego!");

        const mensaje = document.getElementById("mensaje-victoria");
        if (mensaje) {
          mensaje.classList.remove("oculto");
          mensaje.classList.add("mostrar");
        }
        return;
      }

      this.element.style.backgroundImage = `url('./assets/Boss/Individual Sprite/Death/Bringer-of-Death_Death_${frame}.png')`;
      frame++;
      setTimeout(animarMuerte, duracionFrame);
    };

    animarMuerte();
  }

  actualizarPosicion() {
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
  }
}












class Moneda {
  constructor() {
    this.x = Math.random() * 700 + 50;
    this.y = Math.random() * 250 + 50;
    this.width = 30;
    this.height = 30;
    this.element = document.createElement("div");
    this.element.classList.add("moneda");

    this.actualizarPosicion();
  }

  actualizarPosicion() {
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
  }
}




const juego = new Game();

// Iniciar música tras presionar una flecha
document.addEventListener("keydown", (event) => {
  const teclasFlecha = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

  if (teclasFlecha.includes(event.key)) {
    juego.iniciarMusica();
    // Evitamos que se vuelva a ejecutar
    document.removeEventListener("keydown", arguments.callee);
  }
});

