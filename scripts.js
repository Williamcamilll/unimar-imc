// ===============================
//        CONFIGURAÇÕES INICIAIS
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  aplicarEventos();
  carregarPerfil();
  renderizarHistorico();
  renderizarLembretes();
  aplicarIdiomaSalvo();
  aplicarTemaSalvo();
  buscarClimaAtual();
});

function aplicarEventos() {
  document.getElementById("unidade").addEventListener("change", atualizarUnidade);
  document.getElementById("form-imc").addEventListener("submit", calcularIMC);
  document.getElementById("limpar-historico").addEventListener("click", limparHistorico);
  document.getElementById("salvar-lembrete").addEventListener("click", salvarLembrete);
  document.getElementById("salvar-perfil").addEventListener("click", salvarPerfil);
  document.getElementById("idioma").addEventListener("change", e => {
    localStorage.setItem("idiomaSelecionado", e.target.value);
    traduzirInterface(e.target.value);
  });
  const toggleTema = document.getElementById("toggle-tema");
  if (toggleTema) toggleTema.addEventListener("click", alternarTema);

  document.querySelector("button[onclick='iniciarPomodoro()']")?.addEventListener("click", iniciarPomodoro);
  document.querySelector("button[onclick='pausarPomodoro()']")?.addEventListener("click", pausarPomodoro);
  document.querySelector("button[onclick='resetarPomodoro()']")?.addEventListener("click", resetarPomodoro);
}

let pomodoroTempo = 1500;
let pomodoroIntervalo = null;

function iniciarPomodoro() {
  if (!pomodoroIntervalo) {
    pomodoroIntervalo = setInterval(() => {
      if (pomodoroTempo > 0) {
        pomodoroTempo--;
        atualizarTempoPomodoro();
      } else {
        clearInterval(pomodoroIntervalo);
        pomodoroIntervalo = null;
        exibirToast("Tempo finalizado! Faça uma pausa. ☕");
      }
    }, 1000);
  }
}

function pausarPomodoro() {
  clearInterval(pomodoroIntervalo);
  pomodoroIntervalo = null;
}

function resetarPomodoro() {
  pomodoroTempo = 1500;
  atualizarTempoPomodoro();
  clearInterval(pomodoroIntervalo);
  pomodoroIntervalo = null;
}

function atualizarTempoPomodoro() {
  const minutos = String(Math.floor(pomodoroTempo / 60)).padStart(2, '0');
  const segundos = String(pomodoroTempo % 60).padStart(2, '0');
  document.getElementById("pomodoro-tempo").textContent = `${minutos}:${segundos}`;
}

function exibirToast(mensagem, erro = false) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast" + (erro ? " erro" : "");
  toast.textContent = mensagem;
  container.appendChild(toast);
  setTimeout(() => container.removeChild(toast), 3000);
}

function buscarClimaAtual() {
  const climaInfo = document.getElementById("clima-info");
  fetch("https://api.open-meteo.com/v1/forecast?latitude=-22.22&longitude=-49.95&current_weather=true")
    .then(res => res.json())
    .then(dado => {
      const c = dado.current_weather;
      climaInfo.textContent = `🌡️ ${c.temperature}°C | 💨 Vento: ${c.windspeed} km/h`;
    })
    .catch(() => climaInfo.textContent = "Erro ao buscar o clima.");
}

// Função para atualizar unidade de medida
function atualizarUnidade() {
  const unidade = this.value;
  document.getElementById("label-peso").textContent = unidade === "imperial" ? "Peso (lb):" : "Peso (kg):";
  document.getElementById("label-altura").textContent = unidade === "imperial" ? "Altura (in):" : "Altura (cm):";
}

// Função para calcular IMC
function calcularIMC(e) {
  e.preventDefault();

  const unidade = document.getElementById("unidade").value;
  let peso = parseFloat(document.getElementById("peso").value);
  let altura = parseFloat(document.getElementById("altura").value);
  const metaPeso = parseFloat(document.getElementById("meta-peso").value);

  if (unidade === "imperial") {
    peso *= 0.453592;
    altura *= 2.54;
  }

  altura /= 100;

  if (!peso || !altura || peso <= 0 || altura <= 0) {
    return exibirErro("Por favor, preencha peso e altura com valores positivos.");
  }

  if (peso < 10 || peso > 400 || altura * 100 < 50 || altura * 100 > 280) {
    return exibirErro("Esses valores não parecem reais. Verifique o peso ou a altura.");
  }

  const imc = (peso / (altura ** 2)).toFixed(2);
  const { mensagem, dieta, exercicio, classeIMC } = gerarRecomendacoes(imc);

  let resultadoTexto = `IMC: ${imc} - ${mensagem}`;

  if (!isNaN(metaPeso) && metaPeso > 0) {
    const diferenca = (peso - metaPeso).toFixed(1);
    resultadoTexto += diferenca === "0.0" ? " | Você já atingiu sua meta de peso!"
      : diferenca > 0 ? ` | Faltam perder ${diferenca} kg para atingir sua meta.`
      : ` | Faltam ganhar ${Math.abs(diferenca)} kg para atingir sua meta.`;
  }

  const frases = [
    "Você está no caminho certo! 💪",
    "Saúde é o que interessa! 💙",
    "Continue firme! Cada passo conta. 🚶",
    "Cuide do seu corpo. Ele é seu templo. 🧘",
    "Persistência leva ao resultado! ✨"
  ];

  const fraseMotivacional = frases[Math.floor(Math.random() * frases.length)];
  resultadoTexto += `\n${fraseMotivacional}`;

  mostrarResultado(resultadoTexto, classeIMC);
  document.getElementById("dieta").textContent = `Dieta recomendada: ${dieta}`;
  document.getElementById("exercicio").textContent = `Exercício recomendado: ${exercicio}`;

  salvarHistorico(peso, altura * 100, imc);
  renderizarHistorico();
  atualizarGraficoIMC();
}

function exibirErro(mensagem) {
  const resultadoEl = document.getElementById("resultado");
  resultadoEl.textContent = mensagem;
  resultadoEl.className = "erro-animacao";
  resultadoEl.setAttribute("aria-live", "assertive");

  setTimeout(() => {
    resultadoEl.classList.remove("erro-animacao");
  }, 1000);
}

function mostrarResultado(texto, classe) {
  const resultadoEl = document.getElementById("resultado");
  resultadoEl.textContent = texto;
  resultadoEl.className = classe;
  resultadoEl.setAttribute("aria-live", "polite");
}

// Função para gerar as recomendações baseado no IMC
function gerarRecomendacoes(imc) {
  if (imc < 18.5) return {
    mensagem: "Abaixo do peso",
    dieta: "Inclua alimentos ricos em nutrientes e calorias saudáveis como abacate, castanhas e azeite de oliva.",
    exercicio: "Priorize exercícios de força para ganho de massa muscular.",
    classeIMC: "imc-baixo"
  };
  if (imc < 24.9) return {
    mensagem: "Peso normal",
    dieta: "Mantenha uma alimentação equilibrada com frutas, legumes, proteínas e carboidratos saudáveis.",
    exercicio: "Continue com uma rotina variada entre cardio e musculação.",
    classeIMC: "imc-normal"
  };
  if (imc < 29.9) return {
    mensagem: "Sobrepeso",
    dieta: "Reduza a ingestão de alimentos processados e aumente o consumo de fibras e proteínas magras.",
    exercicio: "Priorize atividades aeróbicas como caminhada, corrida ou bicicleta.",
    classeIMC: "imc-sobrepeso"
  };
  return {
    mensagem: "Obesidade",
    dieta: "Consulte um nutricionista. Evite doces, frituras e prefira alimentos naturais.",
    exercicio: "Comece com atividades leves e frequentes, como caminhadas e pilates.",
    classeIMC: "imc-obesidade"
  };
}

// Função para salvar o perfil do usuário no localStorage
function salvarPerfil() {
  const nome = document.getElementById("nome").value.trim();
  const idade = document.getElementById("idade").value.trim();
  const sexo = document.getElementById("sexo").value;
  localStorage.setItem("perfilUsuarioIMC", JSON.stringify({ nome, idade, sexo }));
  alert("Perfil salvo com sucesso!");
}

// Função para carregar o perfil salvo
function carregarPerfil() {
  const perfil = JSON.parse(localStorage.getItem("perfilUsuarioIMC"));
  if (perfil) {
    document.getElementById("nome").value = perfil.nome;
    document.getElementById("idade").value = perfil.idade;
    document.getElementById("sexo").value = perfil.sexo;
  }
}

// Função para salvar o histórico de IMC
function salvarHistorico(peso, altura, imc) {
  const historico = JSON.parse(localStorage.getItem("historicoIMC")) || [];
  historico.unshift({ data: new Date().toLocaleString(), peso, altura, imc });
  localStorage.setItem("historicoIMC", JSON.stringify(historico));
}

// Função para renderizar o histórico de IMC
function renderizarHistorico() {
  const historico = JSON.parse(localStorage.getItem("historicoIMC")) || [];
  const tbody = document.querySelector("#historico tbody");
  tbody.innerHTML = "";
  historico.forEach(entry => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${entry.data}</td><td>${entry.peso}</td><td>${entry.altura}</td><td>${entry.imc}</td>`;
    tbody.appendChild(row);
  });
  atualizarGraficoIMC();
}

// Função para limpar o histórico
function limparHistorico() {
  localStorage.removeItem("historicoIMC");
  renderizarHistorico();
}

// Função para salvar um lembrete
function salvarLembrete() {
  const lembrete = document.getElementById("lembrete").value.trim();
  if (!lembrete) return;
  const lembretes = JSON.parse(localStorage.getItem("lembretesIMC")) || [];
  lembretes.push(lembrete);
  localStorage.setItem("lembretesIMC", JSON.stringify(lembretes));
  document.getElementById("lembrete").value = "";
  renderizarLembretes();
}

// Função para renderizar lembretes
function renderizarLembretes() {
  const lembretes = JSON.parse(localStorage.getItem("lembretesIMC")) || [];
  const lista = document.getElementById("lista-lembretes");
  lista.innerHTML = "";
  lembretes.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = item;
    const botaoRemover = document.createElement("button");
    botaoRemover.textContent = "Remover";
    botaoRemover.onclick = () => {
      lembretes.splice(index, 1);
      localStorage.setItem("lembretesIMC", JSON.stringify(lembretes));
      renderizarLembretes();
    };
    li.appendChild(botaoRemover);
    lista.appendChild(li);
  });
}

// Função para atualizar o gráfico de IMC
function atualizarGraficoIMC() {
  const historico = JSON.parse(localStorage.getItem("historicoIMC")) || [];
  const labels = historico.map(e => e.data).reverse();
  const dados = historico.map(e => e.imc).reverse();
  const ctx = document.getElementById("graficoIMC").getContext("2d");
  if (window.graficoIMC) {
    window.graficoIMC.destroy();
  }
  window.graficoIMC = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "IMC",
        data: dados,
        borderColor: "#0072ce",
        backgroundColor: "rgba(0, 114, 206, 0.1)",
        tension: 0.3,
        fill: true,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#0072ce",
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          suggestedMin: 15,
          suggestedMax: 40
        }
      },
      plugins: {
        legend: {
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--cor-texto')
          }
        }
      }
    }
  });
}

// Função para aplicar o idioma salvo
function aplicarIdiomaSalvo() {
  const idioma = localStorage.getItem("idiomaSelecionado") || "pt";
  document.getElementById("idioma").value = idioma;
  traduzirInterface(idioma);
}

// Função para aplicar o tema salvo
function aplicarTemaSalvo() {
  const tema = localStorage.getItem("temaIMC") || "light";
  document.documentElement.setAttribute("data-tema", tema);
}

// Função para alternar o tema
function alternarTema() {
  const root = document.documentElement;
  const temaAtual = root.getAttribute("data-tema") || "light";
  const novoTema = temaAtual === "light" ? "dark" : "light";
  root.setAttribute("data-tema", novoTema);
  localStorage.setItem("temaIMC", novoTema);
}

// Função para traduzir a interface
function traduzirInterface(idioma) {
  const traducoes = {
    pt: {
      titulo: "Calculadora de IMC",
      subtitulo: "Projeto Engenharia de Software - ADS | Unimar",
      perfil: "Perfil do Usuário",
      nome: "Nome:", idade: "Idade:", sexo: "Sexo:", salvarPerfil: "Salvar Perfil",
      peso: "Peso (kg):", altura: "Altura (cm):", meta: "Meta de Peso (kg):",
      calcular: "Calcular IMC", recomendacoes: "Recomendações Personalizadas",
      faixas: "Faixas de IMC", classificacao: "Classificação",
      abaixo: "Abaixo do peso", normal: "Peso normal",
      sobrepeso: "Sobrepeso", obesidade: "Obesidade",
      historico: "Histórico de Cálculos", data: "Data", limpar: "Limpar Histórico",
      lembretes: "Lembretes Personalizados", escreva: "Escreva um lembrete:", salvarLembrete: "Salvar Lembrete"
    },
    en: {
      titulo: "BMI Calculator", subtitulo: "Software Engineering Project - ADS | Unimar",
      perfil: "User Profile", nome: "Name:", idade: "Age:", sexo: "Gender:", salvarPerfil: "Save Profile",
      peso: "Weight (kg):", altura: "Height (cm):", meta: "Weight Goal (kg):",
      calcular: "Calculate BMI", recomendacoes: "Personalized Recommendations",
      faixas: "BMI Ranges", classificacao: "Classification",
      abaixo: "Underweight", normal: "Normal weight",
      sobrepeso: "Overweight", obesidade: "Obesity",
      historico: "Calculation History", data: "Date", limpar: "Clear History",
      lembretes: "Personal Reminders", escreva: "Write a reminder:", salvarLembrete: "Save Reminder"
    },
    es: {
      titulo: "Calculadora de IMC", subtitulo: "Proyecto Ingeniería de Software - ADS | Unimar",
      perfil: "Perfil del Usuario", nome: "Nombre:", idade: "Edad:", sexo: "Sexo:", salvarPerfil: "Guardar Perfil",
      peso: "Peso (kg):", altura: "Altura (cm):", meta: "Meta de Peso (kg):",
      calcular: "Calcular IMC", recomendacoes: "Recomendaciones Personalizadas",
      faixas: "Rangos de IMC", classificacao: "Clasificación",
      abaixo: "Bajo peso", normal: "Peso normal",
      sobrepeso: "Sobrepeso", obesidade: "Obesidad",
      historico: "Historial de Cálculos", data: "Fecha", limpar: "Limpiar Historial",
      lembretes: "Recordatorios Personalizados", escreva: "Escribe un recordatorio:", salvarLembrete: "Guardar Recordatorio"
    },
    zh: {
      titulo: "BMI计算器", subtitulo: "软件工程项目 - ADS | Unimar",
      perfil: "用户资料", nome: "姓名:", idade: "年龄:", sexo: "性别:", salvarPerfil: "保存资料",
      peso: "体重 (kg):", altura: "身高 (cm):", meta: "体重目标 (kg):",
      calcular: "计算BMI", recomendacoes: "个性化推荐",
      faixas: "BMI范围", classificacao: "分类",
      abaixo: "体重过轻", normal: "正常体重",
      sobrepeso: "超重", obesidade: "肥胖",
      historico: "计算历史", data: "日期", limpar: "清除历史",
      lembretes: "个性化提醒", escreva: "写下一个提醒:", salvarLembrete: "保存提醒"
    }
  };
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const chave = el.getAttribute("data-i18n");
    if (traducoes[idioma][chave]) el.textContent = traducoes[idioma][chave];
  });
}
