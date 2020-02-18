# Repositório de Customizações Botfactory

Fornece funções customizadas para uso nas integrações do botfcatory

# Lista de Customizações


## bot-templates

Lista de Modelos Padrões do SeniorX Botfactory [Link](http://git.senior.com.br/arquitetura/botfactory-customization/tree/master/ecm-datatable).


## hcm-vacation

Funcionalidade para acesso a rotina de férias do Senior HCM.


Obtendo informações de férias de um colaborador

>  curl -i -H "Authorizarion: Bearer <access_token>" -H "Content-Type: application/json" https://m8pyfq01r6.execute-api.us-east-1.amazonaws.com/default/botfactory-hcm-ferias?q=FUNCIONALIDADE


| Funcionalidade | Descrição |
| ------ | ------ |
| saldo-ferias | Retorna saldo de férias do colaborador. Ex: Seu saldo atual: 20 dias no período aquisitivo de 01/01/2019 a 31/12/2019. |
| minha-programacao-ferias | Consultas as programações férias. Ex: Você possui a seguinte programação de férias 20 dias com início em 01/04/2020 | 
| voltar-das-ferias| Consulta a data para retorno das férias atuais | 


## ecm-datatable 


Funcionalidade para acesso as tabeas do ECM usada em customizações do botfactory.
Neste cenário o usuário importar um arquivo .cvs e disponibilizar informações em uma tabela com chave valor.

Tabela  bot_answers_erp_mercado

|question | answer |
|----------|-------------
mercado_faturamento_faturamentodia|Você não possui faturamento hoje - atualizado em 21/01/2020 08:56.
mercado_faturamento_faturamentoontem|Não houve faturamento ontem - atualizado em 21/01/2020 08:56.
mercado_faturamento_faturamentomes|Você ainda não possui faturamento no mês 1/2020 - atualizado em 21/01/2020 08:56.
mercado_faturamento_faturamentoano|O faturamento deste ano é de 57.365.779 - atualizado em 10/02/2020 08:30.
mercado_faturamento_faturamentoanopassado|O faturamento do ano passado foi de 416.964.524 - atualizado em 10/02/2020 08:30.
mercado_clientes|Você possui 711 cliente(s) ativo(s) - atualizado em 21/01/2020 08:56.




Obtendo informações de uma tabela criada no ECM 

> curl -i  https://thmxqru22e.execute-api.us-east-1.amazonaws.com/default/bot-erp-template >
>  -H "Content-type: application/json" \
>  -H "Accept: application/json" \
>  -H "Authorizarion: Bearer <access_token>" \
>  -d '{ "dataTable" : "bot_answers_erp_mercado", "dataKey" : "mercado_faturamento_faturamentoanopassado" }' \
