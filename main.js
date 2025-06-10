class Game {
  constructor() {
    this.container = document.getElementById("game-container");
    // this.puntosElement = document.getElementById("puntos");
    this.personaje = null;
    this.monedas = [];
    this.puntuacion = 0;

    this.crearEscenario();
    this.agregarEventos();
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
  window.addEventListener("keydown", (e) => this.personaje.mover(e));

  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      this.personaje.detenerAnimacion();
    }
  });

  this.checkColisiones();
}



  checkColisiones() {
    setInterval(() => {
      this.monedas.forEach((moneda, index) => {
        if (this.personaje.colisionaCon(moneda)) {
          this.container.removeChild(moneda.element);
          this.monedas.splice(index, 1);
          this.actualizarPuntuacion(10);
        }
      });
    }, 100);
  }

//   actualizarPuntuacion(puntos) {
//     this.puntuacion += puntos;
//     this.puntosElement.textContent = `Puntos: ${this.puntuacion}`;
//   }
 }

class Personaje {
  constructor() {
    this.x = 100;
    this.posicionInicialY = 450;
    this.y = this.posicionInicialY;
    this.width = 100;
    this.height = 100;
    this.velocidad = 10;
    this.saltando = false;
    this.direccion = 1; // 1 = derecha, -1 = izquierda
    this.animando = false;

    this.element = document.createElement("div");
    this.element.classList.add("personaje", "grande");
    this.actualizarPosicion();
  }

 mover(evento) {
  if (evento.key === "ArrowRight") {
    this.x += this.velocidad;

    if (this.direccion !== 1) {
      this.direccion = 1;
      this.element.style.transform = "scale(2) scaleX(1)";
    }

    // Solo añadir la animación si no está activa
    if (!this.element.classList.contains("animar-caminar")) {
      this.element.classList.add("animar-caminar");
    }

  } else if (evento.key === "ArrowLeft") {
    this.x -= this.velocidad;

    if (this.direccion !== -1) {
      this.direccion = -1;
      this.element.style.transform = "scale(2) scaleX(-1)";
    }

    if (!this.element.classList.contains("animar-caminar")) {
      this.element.classList.add("animar-caminar");
    }

  } else if (evento.key === "ArrowUp" && !this.saltando) {
    this.saltar();
  }

  this.actualizarPosicion();
}


  detenerAnimacion() {
    this.element.classList.remove("animar-caminar");
    this.animando = false;
  }

  saltar() {
    this.saltando = true;
    let alturaMaxima = this.y - 250;

    const salto = setInterval(() => {
      if (this.y > alturaMaxima) {
        this.y -= 16;
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
      }
      this.actualizarPosicion();
    }, 20);
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