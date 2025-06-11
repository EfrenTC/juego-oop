class Game {
  constructor() {
    this.container = document.getElementById("game-container");
    this.personaje = null;
    this.monedas = [];
    this.enemigos = [];
    this.puntuacion = 0;

    this.crearEscenario();
    this.agregarEventos();
    this.crearEnemigos();
    this.loopJuego(); // Cambié el nombre para ser más descriptivo
  }

  crearEscenario() {
    this.personaje = new Personaje();
    this.container.appendChild(this.personaje.element);

    for (let i = 0; i < 5; i++) {
      const moneda = new Moneda();
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
        this.personaje.mover(e);
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        this.personaje.detenerAnimacion();
      }
    });

    this.checkColisiones();
  }

  crearEnemigos() {
    // Crear enemigos con referencia al personaje
    const enemigo1 = new Enemigo(600, 590, this.personaje);
    const enemigo2 = new Enemigo(1000, 590, this.personaje);
    this.enemigos.push(enemigo1, enemigo2);

    this.enemigos.forEach((enemigo) => {
      this.container.appendChild(enemigo.element);
    });
  }

  loopJuego() {
    // Actualizar enemigos
    this.enemigos.forEach((enemigo, index) => {
      if (enemigo.vida > 0) {
        enemigo.update();

        // Verificar colisión con el jugador para daño
        if (enemigo.colisionaCon(this.personaje) && !this.personaje.invulnerable) {
          console.log("¡Enemigo toca al jugador!");
          // No hacer daño por simple contacto, solo cuando ataque
        }
      } else {
        // Remover enemigos muertos
        this.enemigos.splice(index, 1);
      }
    });

    // Continuar el bucle usando requestAnimationFrame para mejor rendimiento
    requestAnimationFrame(() => this.loopJuego());
  }

procesarAtaqueJugador() {
  const personajeRect = this.personaje.element.getBoundingClientRect();

  this.enemigos.forEach((enemigo, index) => {
    const enemigoRect = enemigo.element.getBoundingClientRect();

    // Verificar colisión visual real (rectángulo contra rectángulo)
    const colisiona = !(
      personajeRect.right < enemigoRect.left ||
      personajeRect.left > enemigoRect.right ||
      personajeRect.bottom < enemigoRect.top ||
      personajeRect.top > enemigoRect.bottom
    );

    // Verificar dirección del ataque
    const direccionCorrecta =
      (this.personaje.direccion === 1 && enemigoRect.left >= personajeRect.left) ||
      (this.personaje.direccion === -1 && enemigoRect.left <= personajeRect.left);

    if (colisiona && direccionCorrecta) {
      enemigo.recibirDaño(this.personaje.dañoAtaque);
      console.log(`¡Golpe exitoso! Enemigo recibe ${this.personaje.dañoAtaque} de daño. Vida enemigo: ${enemigo.vida}`);

      // Efecto de empuje al enemigo
      const fuerzaEmpuje = 30;
      if (this.personaje.direccion === 1) {
        enemigo.x += fuerzaEmpuje;
      } else {
        enemigo.x -= fuerzaEmpuje;
      }

      this.actualizarPuntuacion(5);

      if (enemigo.vida <= 0) {
        this.actualizarPuntuacion(50);
        console.log('¡Enemigo eliminado! +50 puntos');
      }
    } else {
      console.log(`Ataque fallido - Colisión: ${colisiona}, Dirección: ${direccionCorrecta}`);
    }
  });
}



  checkColisiones() {
    setInterval(() => {
      // Colisiones con monedas
      this.monedas.forEach((moneda, index) => {
        if (this.personaje.colisionaCon(moneda)) {
          this.container.removeChild(moneda.element);
          this.monedas.splice(index, 1);
          this.actualizarPuntuacion(10);

          // Las monedas pueden curar al jugador
          this.personaje.curar(5);
        }
      });
    }, 100);
  }

  // Método para obtener estadísticas del juego
  getEstadisticasJuego() {
    return {
      puntuacion: this.puntuacion,
      vidaJugador: this.personaje.vida,
      enemigosVivos: this.enemigos.filter(e => e.vida > 0).length,
      monedasRestantes: this.monedas.length
    };
  }

  actualizarPuntuacion(puntos) {
    this.puntuacion += puntos;
    // Si tienes un elemento para mostrar la puntuación, descomenta la siguiente línea
    // this.puntosElement.textContent = `Puntos: ${this.puntuacion}`;
    console.log(`Puntuación: ${this.puntuacion}`);
  }
}


class Personaje {
  constructor() {
    this.x = 100;
    this.posicionInicialY = 590;
    this.y = this.posicionInicialY;
    this.width = 100;
    this.height = 100;
    this.velocidad = 10;
    this.saltando = false;
    this.direccion = 1;
    this.animando = false;
    this.atacando = false;
    this.moviendo = false;

    // Sistema de vida y combate
    this.vida = 100;
    this.vidaMaxima = 100;
    this.dañoAtaque = 50;
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
      this.barraVida.style.backgroundColor = '#4CAF50'; // Verde
    } else if (porcentajeVida > 30) {
      this.barraVida.style.backgroundColor = '#FF9800'; // Naranja
    } else {
      this.barraVida.style.backgroundColor = '#F44336'; // Rojo
    }
  }

  mover(evento) {
    if (this.atacando) return; // no mover mientras ataca

    this.moviendo = true;

    if (evento.key === "ArrowRight") {
      this.x += this.velocidad;
      if (this.direccion !== 1) {
        this.direccion = 1;
        this.element.style.transform = "scale(2) scaleX(1)";
      }
      this.iniciarAnimacionCaminar();

    } else if (evento.key === "ArrowLeft") {
      this.x -= this.velocidad;
      if (this.direccion !== -1) {
        this.direccion = -1;
        this.element.style.transform = "scale(2) scaleX(-1)";
      }
      this.iniciarAnimacionCaminar();

    } else if (evento.key === "ArrowUp" && !this.saltando) {
      this.saltar();
    }

    this.actualizarPosicion();
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
    this.saltando = true;
    this.element.classList.remove("animar-caminar");
    this.element.style.backgroundImage = "url('./assets/Jump.png')";

    let alturaMaxima = this.y - 250;
    const salto = setInterval(() => {
      if (this.y > alturaMaxima) {
        this.y -= 30;
      } else {
        clearInterval(salto);
        this.caer();
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

        // Regresar sprite
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
    this.element.classList.add("animar-atacar");

    // Retornar true para indicar que está atacando (para el sistema de combate)
    setTimeout(() => {
      this.atacando = false;
      this.element.classList.remove("animar-atacar");

      // Volver a sprite adecuado
      if (this.saltando) {
        this.element.style.backgroundImage = "url('./assets/Jump.png')";
      } else if (this.moviendo) {
        this.element.style.backgroundImage = "url('./assets/Run.png')";
        this.element.classList.add("animar-caminar");
      } else {
        this.element.style.backgroundImage = "url('./assets/Idle.png')";
      }
    }, 400);

    return true; // Indica que el ataque se ejecutó
  }

  recibirDaño(cantidad) {
    if (this.invulnerable || this.vida <= 0) return;

    this.vida -= cantidad;
    this.vida = Math.max(0, this.vida); // No bajar de 0

    console.log(`¡Jugador recibe ${cantidad} de daño! Vida restante: ${this.vida}`);

    // Efecto visual de daño
    this.element.style.filter = 'brightness(2) hue-rotate(0deg)';
    this.element.classList.add('dañado');

    // Período de invulnerabilidad
    this.invulnerable = true;
    this.element.style.opacity = '0.5';

    setTimeout(() => {
      this.element.style.filter = 'brightness(1)';
      this.element.classList.remove('dañado');
      this.element.style.opacity = '1';
      this.invulnerable = false;
    }, this.tiempoInvulnerabilidad);

    this.actualizarBarraVida();

    // Verificar muerte
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

    // Aquí puedes agregar lógica de game over
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
    this.width = 256;  // Nueva anchura
    this.height = 320; // Nueva altura

    // Suponemos que "y" es la posición del suelo (la base) y añadimos un offset para bajarlo 20px más.
    this.y = (typeof y === 'number') ? (y - this.height + 150) : 100;
    
    this.velocidad = 0.3;
    this.direccion = -1;
    this.jugador = jugador;
    this.estado = 'patrullando';
    this.rangoDeteccion = 150;
    this.rangoAtaque = 100;
    this.vida = 100;
    this.dañoAtaque = 15;
    this.tiempoUltimoAtaque = 0;
    this.cooldownAtaque = 2000;

    this.puntoInicialX = x;
    this.rangoPatrullaje = 100;
    this.limiteIzquierdo = Math.max(0, x - this.rangoPatrullaje / 2);
    this.limiteDerecho = Math.min(window.innerWidth - this.width, x + this.rangoPatrullaje / 2);

    this.element = document.createElement("div");
    this.element.classList.add("enemigo");
    document.body.appendChild(this.element);

    this.actualizarPosicion();
    this.element.style.transform = `scaleX(${this.direccion})`;

    // Estado para controlar animaciones
    this.atacando = false;
  }

  actualizarPosicion() {
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
  }
  

  update() {
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
    if (this.atacando) return; // No se mueve si está atacando

    this.x += this.velocidad * this.direccion;
    this.iniciarAnimacionCaminar();

    // Cambiar dirección en los límites de patrullaje
    if (this.x <= this.limiteIzquierdo || this.x >= this.limiteDerecho) {
      this.direccion *= -1;
      this.element.style.transform = `scaleX(${this.direccion})`;
    }
  }

  perseguir() {
    if (this.atacando) return; // No se mueve si está atacando

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

    this.iniciarAnimacionCaminar();
  }

  atacar() {
    if (this.atacando) return; // No puede atacar mientras ataca

    const tiempoActual = Date.now();

    if (tiempoActual - this.tiempoUltimoAtaque >= this.cooldownAtaque) {
      this.atacando = true;
      this.detenerAnimacionCaminar();
      this.iniciarAnimacionAtacar();
      this.realizarAtaque();
      this.tiempoUltimoAtaque = tiempoActual;

      setTimeout(() => {
        this.atacando = false;
        this.detenerAnimacionAtacar();
      }, 400); // duración del ataque en ms
    }

    // Orientarse hacia el jugador
    const direccionAlJugador = this.x < this.jugador.x ? 1 : -1;
    if (this.direccion !== direccionAlJugador) {
      this.direccion = direccionAlJugador;
      this.element.style.transform = `scaleX(${this.direccion})`;
    }
  }

  realizarAtaque() {
    // Efecto visual de ataque
    this.element.style.filter = 'brightness(1.5)';
    setTimeout(() => {
      this.element.style.filter = 'brightness(1)';
    }, 200);

    // Infligir daño al jugador si está en rango
    const distancia = Math.abs(this.x - this.jugador.x);
    if (distancia <= this.rangoAtaque) {
      this.jugador.recibirDaño(this.dañoAtaque);
      console.log(`¡Enemigo ataca! Jugador recibe ${this.dañoAtaque} de daño`);
    }
  }

  recibirDaño(cantidad) {
    this.vida -= cantidad;

    // Efecto visual de daño
    this.element.style.filter = 'brightness(2) hue-rotate(0deg)';
    setTimeout(() => {
      this.element.style.filter = 'brightness(1)';
    }, 150);

    if (this.vida <= 0) {
      this.morir();
    }
  }

morir() {
  this.estado = 'muerto'; // Evita que siga atacando o patrullando
  this.iniciarAnimacionMuerte();

  // Eliminar al enemigo tras la animación
  setTimeout(() => {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }, 1000); // Ajusta el tiempo si la animación dura más o menos
}



  actualizarPosicion() {
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
  }

  verificarColisiones() {
    if (this.colisionaCon(this.jugador)) {
      const fuerzaEmpuje = 5;
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

  // Animaciones y sprites
  iniciarAnimacionCaminar() {
    if (!this.element.classList.contains("animar-caminar")) {
      this.element.style.backgroundImage = "url('./assets/enemy/Sprites/Run.png')";
      this.element.classList.add("animar-caminar");
    }
  }

  detenerAnimacionCaminar() {
    this.element.classList.remove("animar-caminar");
    this.element.style.backgroundImage = "url('./assets/enemy/Sprites/Idle.png')";
  }

  iniciarAnimacionAtacar() {
    this.element.classList.add("animar-atacar");
    this.element.style.backgroundImage = "url('./assets/enemy/Sprites/Attack1.png')";
  }

  detenerAnimacionAtacar() {
    this.element.classList.remove("animar-atacar");
    this.element.style.backgroundImage = "url('./assets/enemy/Sprites/Idle.png')";
  }

  iniciarAnimacionMuerte() {
  // Detener cualquier otra animación activa
  this.element.classList.remove("animar-caminar", "animar-atacar");

  // Cambiar sprite a Death.png
  this.element.style.backgroundImage = "url('./assets/enemy/Sprites/Death.png')";

  // Activar animación de muerte si tienes un spritesheet animado
  this.element.classList.add("animar-morir");
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