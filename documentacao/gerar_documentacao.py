import os
import zipfile
from xml.sax.saxutils import escape


ROOT = os.path.dirname(__file__)
OUTPUT = os.path.join(ROOT, "documentacao-projeto.docx")
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


def text_run(value, bold=False, color=None, size=None):
    props = "<w:b/>" if bold else ""
    if color:
        props += '<w:color w:val="%s"/>' % color
    if size:
        props += '<w:sz w:val="%s"/>' % size
    rpr = "<w:rPr>%s</w:rPr>" % props if props else ""
    chunks = []
    for index, line in enumerate(str(value).split("\n")):
        if index:
            chunks.append("<w:br/>")
        chunks.append('<w:t xml:space="preserve">%s</w:t>' % escape(line))
    return "<w:r>%s%s</w:r>" % (rpr, "".join(chunks))


def p(value="", style=None, align=None, bold=False, size=None):
    props = []
    if style:
        props.append('<w:pStyle w:val="%s"/>' % style)
    if align:
        props.append('<w:jc w:val="%s"/>' % align)
    return "<w:p><w:pPr>%s</w:pPr>%s</w:p>" % (
        "".join(props), text_run(value, bold, size=size)
    )


def page_break():
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def table(rows):
    if not rows:
        return ""
    count = max(map(len, rows))
    borders = (
        '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="D8DEE8"/>'
        '<w:left w:val="single" w:sz="4" w:color="D8DEE8"/>'
        '<w:bottom w:val="single" w:sz="4" w:color="D8DEE8"/>'
        '<w:right w:val="single" w:sz="4" w:color="D8DEE8"/>'
        '<w:insideH w:val="single" w:sz="4" w:color="D8DEE8"/>'
        '<w:insideV w:val="single" w:sz="4" w:color="D8DEE8"/></w:tblBorders>'
    )
    xml = '<w:tbl><w:tblPr>%s</w:tblPr><w:tblGrid>%s</w:tblGrid>' % (
        borders, '<w:gridCol w:w="%d"/>' % (9000 // count) * count
    )
    for row_index, row in enumerate(rows):
        xml += "<w:tr>"
        for value in row:
            header = row_index == 0
            fill = '<w:shd w:fill="315EC7"/>' if header else ""
            color = "FFFFFF" if header else None
            cell_run = text_run(value, header, color, 18 if count >= 3 else 20)
            xml += (
                "<w:tc><w:tcPr>%s</w:tcPr><w:p>%s</w:p></w:tc>"
                % (fill, cell_run)
            )
        for _ in range(count - len(row)):
            xml += "<w:tc><w:p/></w:tc>"
        xml += "</w:tr>"
    return xml + "</w:tbl>"


SECTIONS = [
    ("4. Introdução", [
        "Este trabalho descreve o protótipo de uma Secretaria Acadêmica Eletrônica para organizar reuniões entre estudantes e coordenação. A solução reúne calendário, solicitação de atendimento, análise e consulta de status em duas interfaces.",
        "A versão é demonstrativa e exclusivamente front-end, construída com HTML, CSS, JavaScript e armazenamento local. Não representa serviço pronto para produção e não emprega dados acadêmicos reais."
    ], None),
    ("5. Contextualização do problema", [
        "Solicitações realizadas por mensagens, correio eletrônico ou presencialmente podem ficar dispersas, dificultando a identificação de horários livres, o acompanhamento do pedido e a prevenção de conflitos. O problema considerado é a falta de uma agenda centralizada e de um fluxo visível de análise.",
        "O protótipo permite selecionar data e intervalo, enviar dados e aguardar a decisão da coordenação, que consulta os pedidos e registra o resultado."
    ], None),
    ("6. Justificativa do projeto", [
        "A centralização favorece a organização dos atendimentos e explicita a diferença entre solicitação pendente e reunião confirmada. O projeto demonstra a integração entre estrutura semântica, apresentação visual, lógica de interface e persistência no navegador.",
        "Tecnologias nativas reduzem dependências e facilitam a apresentação acadêmica, desde que as limitações de segurança e persistência sejam consideradas."
    ], None),
    ("7. Objetivo geral", [
        "Desenvolver um protótipo demonstrável para registrar solicitações de reunião e permitir que a coordenação as aprove ou recuse, com atualização de disponibilidade e consulta de situação."
    ], None),
    ("8. Objetivos específicos", [
        "Disponibilizar áreas distintas; apresentar calendário mensal ao estudante e visualizações mensal, semanal e diária à coordenação; selecionar dias úteis futuros e intervalos predefinidos; validar campos e CPF; registrar pedidos pendentes; prevenir reservas ativas duplicadas no fluxo normal; permitir análise; persistir os registros; e documentar requisitos, arquitetura, limitações e testes."
    ], None),
    ("9. Descrição geral do sistema", [
        "A página inicial permite escolher entre área do aluno e coordenação. O estudante seleciona um dia útil futuro, escolhe um intervalo e informa nome, RA, CPF, curso e motivo. O pedido fica pendente até análise.",
        "A coordenação consulta indicadores, calendários e lista filtrável. A aprovação confirma a reunião e mantém o intervalo ocupado; a recusa libera o intervalo. Os registros são compartilhados entre páginas no armazenamento local."
    ], None),
    ("10. Público-alvo", [
        "Estudantes que solicitam atendimento e pessoas responsáveis pela coordenação de curso que organizam e analisam pedidos. A aplicação não valida vínculo institucional nem autentica os perfis."
    ], None),
    ("11. Escopo do projeto", [
        "Inclui interfaces, calendários, seis intervalos fixos por dia útil, validação básica, criação e consulta de pedidos, análise, indicadores, filtros, mensagens, persistência local e adaptação a telas estreitas.",
        "Não inclui autenticação, autorização, backend, banco de dados compartilhado, configuração de disponibilidade, notificações, cancelamento, reagendamento, integrações externas ou trilha de auditoria."
    ], None),
    ("12. Requisitos funcionais", [
        "A cobertura a seguir refere-se ao protótipo local e não implica prontidão institucional."
    ], [
        ["ID", "Requisito", "Cobertura"],
        ["RF01–RF02", "Interfaces para coordenação e estudante.", "Implementado"],
        ["RF03–RF05", "Calendário, navegação mensal e indicação de pedidos.", "Implementado"],
        ["RF06–RF08", "Disponibilidade, seleção de data e horários livres.", "Implementado"],
        ["RF09–RF11", "Nome, RA, CPF, curso e motivo.", "Implementado; validação no navegador"],
        ["RF12–RF13", "Registro do pedido com status PENDENTE.", "Implementado"],
        ["RF14–RF16", "Detalhes, aprovação e recusa.", "Implementado; modal"],
        ["RF17–RF19", "Atualização de status, conflitos e calendário.", "Implementado; sem transação distribuída"],
        ["RF20–RF22", "Consulta, mensagens e armazenamento local.", "Implementado"]
    ]),
    ("13. Requisitos não funcionais", [
        "Os requisitos foram considerados de acordo com a natureza demonstrativa. Compatibilidade foi verificada no navegador integrado disponível; recomenda-se repetir a matriz completa no ambiente de apresentação."
    ], [
        ["ID", "Requisito", "Tratamento"],
        ["RNF01", "Usabilidade", "Fluxos separados, rótulos e ações identificadas."],
        ["RNF02", "Responsividade", "CSS adaptável; verificação em viewport de 390 px."],
        ["RNF03–RNF04", "Desempenho e compatibilidade", "Operações locais; navegador integrado disponível."],
        ["RNF05–RNF06", "Organização e manutenção", "Separação de páginas, estilos, lógica e persistência."],
        ["RNF07–RNF08", "Consistência e integridade", "Mesmo estado compartilhado; revalidação de reservas."],
        ["RNF09", "Segurança e privacidade", "Avisos; sem autenticação ou criptografia; não usar dados reais."],
        ["RNF10", "Acessibilidade", "Rótulos, aria-live, foco visível e status textuais."],
        ["RNF11–RNF12", "Persistência e evolução", "localStorage; camada isolada para futura API."]
    ]),
    ("14. Regras de negócio", [
        "A disponibilidade fixa é própria desta demonstração, não uma configuração institucional."
    ], [
        ["ID", "Regra implementada"],
        ["RN01", "Intervalos: 09:00, 10:00, 11:00, 14:00, 15:00 e 16:00."],
        ["RN02–RN03", "Dias úteis atuais ou futuros; horários passados de hoje não são oferecidos."],
        ["RN04–RN06", "Novo pedido PENDENTE; pendentes/aprovados reservam; recusados liberam."],
        ["RN07–RN08", "Somente pedidos pendentes são analisados; aprovação revalida o intervalo."],
        ["RN09–RN10", "Campos e CPF válidos; consulta exige RA e CPF correspondentes."]
    ]),
    ("15. Tecnologias utilizadas", [
        "HTML5 estrutura documentos, formulários, navegação, calendários e diálogo. CSS3 define identidade visual e responsividade. JavaScript implementa calendário, validações, solicitações, análise e atualização. A API Web Storage, via localStorage, mantém o estado no navegador.",
        "Não foram adicionadas bibliotecas de terceiros ou fontes externas. O projeto pode ser servido estaticamente ou aberto em navegador compatível."
    ], None),
    ("16. Arquitetura e organização do sistema", [
        "A arquitetura é cliente-side. armazenamento.js centraliza leitura e escrita; app.js contém utilitários; calendario.js desenha os calendários; aluno.js e coordenador.js conectam eventos e dados às páginas. A separação facilita manutenção, mas não fornece sincronização distribuída."
    ], [
        ["Caminho", "Responsabilidade"],
        ["index.html", "Entrada e escolha de área."],
        ["aluno.html / coordenador.html", "Interfaces dos dois perfis."],
        ["css/style.css e css/*.css", "Estilos compartilhados e específicos."],
        ["js/armazenamento.js", "Estado versionado, LocalStorage, disponibilidade e status."],
        ["js/app.js / js/calendario.js", "Utilitários e renderização mensal, semanal e diária."],
        ["js/aluno.js / js/coordenador.js", "Interações de cada área."],
        ["tests/armazenamento.test.js", "Testes nativos do Node.js."]
    ]),
    ("17. Descrição do funcionamento do HTML", [
        "Os documentos definem idioma, metadados, títulos, navegação, áreas, formulários e regiões acessíveis. Cada página carrega seus estilos e scripts. Formulários usam labels, limites de comprimento e mensagens aria-live; os detalhes administrativos usam dialog."
    ], None),
    ("18. Descrição do funcionamento do CSS", [
        "As folhas aplicam cores, tipografia de sistema, cartões, botões e indicadores. A folha global define navegação e componentes comuns; as folhas específicas definem grade, campos, lista e modal. Media queries reorganizam painéis em telas menores; status combinam cor e texto."
    ], None),
    ("19. Descrição do funcionamento do JavaScript", [
        "Handlers controlam seleção de data/horário, envio e consulta, navegação, filtros, diálogo e análise. Dados inseridos na interface são escapados antes de formar HTML dinâmico. Reservas são revalidadas antes de gravar ou aprovar e erros são apresentados."
    ], None),
    ("20. Funcionamento do LocalStorage", [
        "A chave secretaria-academica.v1 armazena JSON versionado com identificador, nome, RA, CPF em dígitos, curso, data, horário, motivo, status e datas de criação/atualização.",
        "O estado permanece no mesmo perfil após recarga. localStorage não criptografa, não controla acesso e não garante gravações atômicas concorrentes; use somente dados fictícios."
    ], None),
    ("21. Descrição da interface do coordenador", [
        "O painel mostra indicadores e a agenda mensal, semanal ou diária; permite navegar por períodos e filtrar solicitações. O botão Gerar exemplos fictícios acrescenta nove solicitações com perfis, cursos, motivos, datas e horários variados, sem substituir registros existentes nem duplicar os exemplos em acionamentos posteriores. Todos os pedidos gerados começam PENDENTES.",
        "O modal apresenta nome, RA, CPF formatado, curso, data, horário, status e motivo. CPF aparece somente nessa visão, mas não existe autenticação; não use dados reais. Aprovar ou recusar os exemplos no painel atualiza os contadores, o calendário e a disponibilidade, como em qualquer outra solicitação."
    ], None),
    ("22. Descrição da interface do aluno", [
        "A interface contém calendário mensal, disponibilidade, seletor de horário, formulário e consulta. Datas passadas e fins de semana ficam desabilitados; horários pendentes ou aprovados não são oferecidos.",
        "O botão Preencher exemplo fictício preenche o formulário e os campos de consulta com dados demonstrativos para facilitar a avaliação. O envio continua manual: o estudante ainda escolhe data e horário disponíveis e confirma o pedido. O exemplo não deve ser interpretado como identidade ou CPF real.",
        "A confirmação informa que a reunião aguarda aprovação. A consulta exige RA e CPF e retorna data, horário, curso e status, sem repetir nome ou CPF."
    ], None),
    ("23. Fluxo de solicitação e aprovação", [
        "Demonstração de cenários: na área da coordenação, acionar Gerar exemplos fictícios para criar solicitações pendentes com diferentes motivos acadêmicos, cursos, datas úteis e horários. Em seguida, abrir os detalhes e aprovar ou recusar cada uma; o estado observado no calendário e nos indicadores acompanha a ação.",
        "Estudante: acessar → escolher dia útil futuro → selecionar horário → preencher dados e motivo → enviar → aguardar → consultar resultado.",
        "Coordenação: abrir painel → localizar pedido → ver detalhes → aprovar ou recusar → atualizar status, agenda e disponibilidade."
    ], None),
    ("24. Modelagem de dados", [
        "A entidade Solicitação representa um pedido; o envelope local contém a versão do esquema e a coleção de registros."
    ], [
        ["Atributo", "Tipo", "Descrição"],
        ["id", "Texto", "Identificador gerado no navegador."],
        ["name, ra, cpf, course", "Texto", "Dados informados; CPF guardado em dígitos."],
        ["date, time", "Texto", "Data AAAA-MM-DD e hora HH:MM."],
        ["reason", "Texto", "Motivo da reunião."],
        ["status", "Enumeração", "PENDENTE, APROVADA ou RECUSADA."],
        ["createdAt, updatedAt", "Data/hora ISO", "Criação e última análise."],
        ["version", "Número", "Versão do envelope local."]
    ]),
    ("25. Diagramas de casos de uso", [
        "Representação textual dentro da fronteira do protótipo: Estudante → (Consultar calendário) → (Solicitar reunião) → (Consultar status); Coordenação → (Visualizar agenda) → (Consultar detalhes) → (Aprovar / Recusar); Sistema → (Validar dados) → (Conferir disponibilidade) → (Persistir) → (Atualizar calendário)."
    ], [
        ["Ator", "Casos de uso"],
        ["Estudante", "Consultar calendário; selecionar data/horário; solicitar reunião; consultar status com RA e CPF."],
        ["Coordenação", "Visualizar agenda; filtrar pedidos; consultar detalhes; aprovar ou recusar."],
        ["Sistema", "Validar dados; verificar disponibilidade; persistir; atualizar calendário e indicadores."]
    ]),
    ("26. Diagrama de atividades do agendamento", [
        "Fluxo: Início → Seleção de data/horário → Validação → (inválido: apresentar erro e retornar ao preenchimento; válido: registrar PENDENTE) → Análise da coordenação → (aprovar: manter ocupado; recusar: liberar) → Atualizar calendário → Fim."
    ], [
        ["Etapa", "Comportamento"],
        ["Início e seleção", "Estudante escolhe uma data útil e horário livre."],
        ["Validação", "Sistema valida data, disponibilidade, campos e CPF."],
        ["Ramo inválido", "Mostra erro e não grava; estudante corrige os dados."],
        ["Registro", "Grava solicitação pendente e reserva o intervalo."],
        ["Decisão", "Coordenação analisa detalhes e aprova ou recusa."],
        ["Aprovada / recusada", "Aprovada mantém ocupação; recusada libera o horário."],
        ["Fim", "Calendário, lista e consulta refletem a decisão."]
    ]),
    ("27. Plano de testes", [
        "Foram combinados sete testes automatizados de armazenamento e cenários de interface no navegador integrado disponível. A execução observada retornou sete testes aprovados e nenhum reprovado. Comando: node --test tests\\armazenamento.test.js.",
        "Na demonstração de dados, foram geradas nove solicitações; todas iniciaram pendentes, duas foram analisadas (uma aprovada e outra recusada), e a geração repetida não criou duplicatas nem alterou estados já decididos.",
        "Os testes de interface foram realizados em 12/11/2026 com dados fictícios. Os registros temporários criados durante a verificação foram removidos."
    ], None),
    ("28. Casos de teste e resultados", [
        "Resultados desta execução; não representam certificação em todos os navegadores ou dispositivos."
    ], [
        ["ID", "Cenário", "Esperado", "Obtido", "Situação"],
        ["CT01", "Pedido em horário livre.", "PENDENTE e confirmação.", "Criado; mensagem indicou aguardo.", "Aprovado"],
        ["CT02", "Duplicidade/horário ocupado.", "Bloquear ou omitir intervalo.", "Teste unitário bloqueou; 09:00 aprovado não foi oferecido.", "Aprovado"],
        ["CT03", "Formulário vazio.", "Informar campos ausentes.", "Mensagem apresentada.", "Aprovado"],
        ["CT04", "CPF inválido.", "Rejeitar sem gravar.", "Erro apresentado; pedido não criado.", "Aprovado"],
        ["CT05", "Aprovar pedido pendente.", "Confirmar e manter ocupado.", "Indicador e agenda atualizados.", "Aprovado"],
        ["CT06", "Recusar pedido.", "Marcar recusado e liberar.", "Contador atualizado; 10:00 voltou a ser oferecido.", "Aprovado"],
        ["CT07", "Recarregar e consultar.", "Manter no perfil local.", "Pedido aprovado permaneceu consultável após recarga.", "Aprovado"],
        ["CT08", "Navegar para o mês seguinte.", "Atualizar rótulo e calendário.", "Novembro avançou para dezembro de 2026.", "Aprovado"],
        ["CT09", "Alternar mês, semana e dia.", "Renderizar três visões.", "month-grid, week-grid e day-grid observados.", "Aprovado"],
        ["CT10", "Viewport de 390 px.", "Sem rolagem horizontal.", "Documento coube na viewport nas duas áreas.", "Aprovado"],
        ["CT11", "Data passada e fim de semana.", "Impedir seleção.", "Células desabilitadas na inspeção.", "Aprovado"],
        ["CT12", "Conflito na aprovação.", "Não aprovar reserva conflitante.", "Teste automatizado confirmou erro.", "Aprovado"],
        ["CT13", "Gerar exemplos de agenda.", "Criar nove pedidos fictícios pendentes em datas e horários variados.", "Nove pedidos criados; calendário e lista atualizados.", "Aprovado"],
        ["CT14", "Analisar e gerar novamente.", "Atualizar status sem duplicar exemplos.", "Uma aprovação, uma recusa; nova execução manteve nove pedidos e os estados.", "Aprovado"]
    ]),
    ("29. Resultados esperados", [
        "Espera-se demonstrar o ciclo de vida do agendamento, distinguir pendente de aprovado, manter coerência entre calendário e registros e bloquear conflitos no fluxo local. Nos testes executados, os comportamentos registrados foram observados.",
        "Os resultados limitam-se ao navegador e ao estado local verificados. Não comprovam operação multiusuário ou funcionamento em todos os navegadores."
    ], None),
    ("30. Limitações do protótipo", [
        "Não há autenticação, autorização ou separação real entre perfis. Qualquer pessoa com acesso ao navegador pode abrir a coordenação e consultar registros locais, que não são criptografados. Não armazene dados reais.",
        "localStorage é específico do perfil e não coordena gravações concorrentes transacionalmente. Não há backend, disponibilidade configurável ou notificações. CPF válido matematicamente não comprova identidade; não foi realizada auditoria formal de segurança."
    ], None),
    ("31. Melhorias futuras", [
        "Recomenda-se backend e banco com transações; autenticação e autorização por papéis; disponibilidade configurável; auditoria; proteção de dados em trânsito e em repouso; política de retenção e minimização segundo a LGPD; cancelamento, reagendamento, justificativas, notificações e integração de calendário.",
        "Também são recomendados testes automatizados em navegadores-alvo, avaliações de acessibilidade e documentação operacional antes de qualquer implantação."
    ], None),
    ("32. Considerações finais", [
        "O protótipo demonstra uma proposta organizada para solicitar e administrar atendimentos, com interfaces distintas, estados textuais, calendário e persistência local. Tecnologias nativas favorecem a compreensão didática.",
        "A inexistência de autenticação, backend e controles adequados impede uso institucional. Uma evolução responsável deverá tratar integridade concorrente, segurança, privacidade, acessibilidade e operação como requisitos centrais."
    ], None),
    ("33. Referências bibliográficas", [
        "Referências técnicas consultadas como base conceitual. A apresentação é inspirada em normas acadêmicas e pode ser ajustada às orientações institucionais."
    ], [
        ["Referência"],
        ["ECMA INTERNATIONAL. ECMAScript® 2025 Language Specification. Disponível em: https://tc39.es/ecma262/. Acesso em: 12 nov. 2026."],
        ["MDN WEB DOCS. Window: localStorage property. Disponível em: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage. Acesso em: 12 nov. 2026."],
        ["WHATWG. HTML Living Standard. Disponível em: https://html.spec.whatwg.org/. Acesso em: 12 nov. 2026."],
        ["WORLD WIDE WEB CONSORTIUM (W3C). Cascading Style Sheets (CSS). Disponível em: https://www.w3.org/Style/CSS/Overview.en.html. Acesso em: 12 nov. 2026."],
        ["BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD). Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm. Acesso em: 12 nov. 2026."]
    ])
]


def make_document():
    content = [
        p("[NOME DA INSTITUIÇÃO]", align="center", bold=True, size=28),
        p("[CURSO]", align="center", bold=True, size=24),
        p("[DISCIPLINA]", align="center", size=22),
        p("[INTEGRANTES]", align="center", size=22),
        p("SECRETARIA ACADÊMICA ELETRÔNICA COM SISTEMA DE AGENDAMENTO",
          align="center", bold=True, size=30),
        p("[CIDADE]\n[ANO]", align="center", size=22),
        page_break(),
        p("SECRETARIA ACADÊMICA ELETRÔNICA COM SISTEMA DE AGENDAMENTO",
          align="center", bold=True, size=28),
        p("[INTEGRANTES]", align="center", size=22),
        p("Trabalho acadêmico apresentado à disciplina [DISCIPLINA], do curso "
          "[CURSO], da [NOME DA INSTITUIÇÃO], como requisito parcial de avaliação.\n\n"
          "Professor(a): [PROFESSOR(A)]"),
        p("[CIDADE]\n[ANO]", align="center", size=22),
        page_break(),
        p("3. Sumário", style="Heading1"),
        p("Atualize a paginação no Word após substituir os campos acadêmicos.")
    ]
    content.extend(p(title, style="TOCEntry") for title, _, _ in SECTIONS)
    content.append(page_break())
    for title, paragraphs, rows in SECTIONS:
        content.append(p(title, style="Heading1"))
        content.extend(p(text) for text in paragraphs)
        if rows:
            content.append(table(rows))
    content.extend([
        p("Nota de edição", style="Heading2"),
        p("Antes da apresentação, substitua os campos entre colchetes e adapte a "
          "capa, folha de rosto, sumário e referências às orientações da instituição. "
          "Não inclua dados reais de estudantes.")
    ])
    section = (
        '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
        '<w:pgMar w:top="1701" w:right="1134" w:bottom="1134" '
        'w:left="1701" w:header="708" w:footer="708"/></w:sectPr>'
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="%s"><w:body>%s%s</w:body></w:document>'
        % (W, "".join(content), section)
    )


STYLES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="360" w:lineRule="auto"/><w:ind w:firstLine="709"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:pPr><w:jc w:val="both"/><w:spacing w:after="120" w:line="360" w:lineRule="auto"/><w:ind w:firstLine="709"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:color w:val="1D2738"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="28"/></w:rPr><w:pPr><w:keepNext/><w:spacing w:before="300" w:after="180"/><w:outlineLvl w:val="0"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="TOCEntry"><w:name w:val="TOC Entry"/><w:basedOn w:val="Normal"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="20"/></w:rPr><w:pPr><w:spacing w:after="60" w:line="260" w:lineRule="auto"/><w:ind w:firstLine="0" w:left="180"/></w:pPr></w:style>
</w:styles>"""
CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>"""
ROOT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>"""
DOC_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>"""
CORE = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Secretaria Acadêmica Eletrônica com Sistema de Agendamento</dc:title><dc:language>pt-BR</dc:language><dc:creator>Projeto acadêmico</dc:creator></cp:coreProperties>"""


def main():
    os.makedirs(ROOT, exist_ok=True)
    with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as docx:
        docx.writestr("[Content_Types].xml", CONTENT_TYPES)
        docx.writestr("_rels/.rels", ROOT_RELS)
        docx.writestr("word/document.xml", make_document())
        docx.writestr("word/styles.xml", STYLES)
        docx.writestr("word/_rels/document.xml.rels", DOC_RELS)
        docx.writestr("docProps/core.xml", CORE)
    with zipfile.ZipFile(OUTPUT) as docx:
        assert docx.testzip() is None
        assert "word/document.xml" in docx.namelist()
        assert b"Secretaria Acad" in docx.read("word/document.xml")
    print("Documento criado e validado: %s (%d bytes)" %
          (OUTPUT, os.path.getsize(OUTPUT)))


if __name__ == "__main__":
    main()
