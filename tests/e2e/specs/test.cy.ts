describe('Fluxo principal do Burro Bluetooth', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('cria uma sala e permite sair com segurança', () => {
    cy.contains('h1', 'Junte a galera.').should('be.visible');
    cy.contains('ion-button', 'Criar uma partida').click();
    cy.url().should('include', '/identificacao?tipo=host');
    cy.get('ion-input input').clear().type('Ana');
    cy.contains('ion-button', 'Continuar').click();
    cy.url().should('include', '/sala-espera');
    cy.contains('h1', 'Chame seus amigos').should('be.visible');
    cy.contains('Ana').should('be.visible');
    cy.get('ion-header ion-button').click();
    cy.url().should('include', '/home');
  });

  it('encontra e entra em uma mesa próxima', () => {
    cy.contains('ion-button', 'Encontrar uma mesa').click();
    cy.get('ion-input input').clear().type('Beto');
    cy.contains('ion-button', 'Continuar').click();
    cy.contains('Partida de teste').should('be.visible').click();
    cy.url().should('include', '/jogo');
    cy.contains('Bluetooth conectado').should('be.visible');
    cy.contains('Sua mão').should('be.visible');
  });
});
