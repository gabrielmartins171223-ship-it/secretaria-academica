# Secretaria Acadêmica Eletrônica

Protótipo acadêmico front-end para solicitar e administrar reuniões entre alunos e coordenação. A interface segue a proposta visual de calendário central, inspirada na organização de agendas digitais, sem reproduzir a identidade do Google Agenda.

## Executar

1. Abra `index.html` em um navegador moderno ou sirva a pasta por um servidor estático local.
2. Escolha **Sou aluno** para enviar e consultar solicitações.
3. Escolha **Sou coordenador** para revisar, aceitar ou recusar solicitações.
4. Para simular o fluxo completo, mantenha as duas áreas no mesmo navegador e perfil.

Não é necessário instalar dependências nem configurar um backend.

## Publicar no GitHub Pages

1. Envie a branch `main` para um repositório GitHub público.
2. No repositório, abra **Settings → Pages** e selecione **GitHub Actions** como origem de implantação.
3. O workflow `.github/workflows/pages.yml` publica o site a cada atualização da branch `main`. A URL ficará disponível na página **Settings → Pages** após a conclusão do workflow.

O site é estático e usa caminhos relativos, portanto funciona no endereço de projeto do GitHub Pages.

## Funcionalidades

- Calendário mensal para alunos e visualizações mensal, semanal e diária para a coordenação.
- Seleção de dias úteis futuros e de intervalos de 09h, 10h, 11h, 14h, 15h e 16h.
- Solicitações pendentes reservam o horário; solicitações aprovadas confirmam-no; recusadas liberam-no.
- Validação de campos e dígitos verificadores do CPF.
- Botão **Preencher exemplo fictício** para testar o cadastro sem inserir dados reais; preenche também RA e CPF na consulta de status.
- Detalhes da reunião em janela modal, com aprovação ou recusa.
- Consulta de status pelo RA e pelo CPF informado no pedido.
- Persistência no `localStorage`, inclusive após atualizar a página.
- Atualização entre abas do mesmo perfil do navegador.

## Estrutura

```text
index.html
aluno.html
coordenador.html
css/
  style.css
  aluno.css
  coordenador.css
js/
  app.js
  calendario.js
  aluno.js
  coordenador.js
  armazenamento.js
documentacao/
  documentacao-projeto.docx
```

## Limitações e privacidade

Este projeto é somente uma demonstração. O `localStorage` não é um banco de dados, não sincroniza navegadores ou dispositivos, não fornece autenticação nem controle de acesso e pode ser lido por qualquer pessoa com acesso ao perfil do navegador. Não utilize dados reais de alunos. A validação no navegador não substitui controles de segurança de um sistema institucional.

Os intervalos são fixos no protótipo. Uma versão de produção precisaria de backend com persistência transacional, autenticação, autorização, política de retenção e medidas adequadas à LGPD.

## Documentação e testes

A documentação acadêmica editável está em `documentacao/documentacao-projeto.docx`. Ela distingue requisitos previstos, funcionalidades implementadas e limitações, e registra os testes executados neste protótipo. Para regenerá-la após editar o conteúdo, execute `python documentacao\gerar_documentacao.py`.

Os testes automatizados das regras de armazenamento usam o runner nativo do Node.js:

```powershell
node --test tests\armazenamento.test.js
```

Também foram exercitados os fluxos de solicitação, aprovação, recusa, consulta, atualização após recarga, navegação e layout móvel no navegador integrado. Os resultados observados estão descritos na documentação.
