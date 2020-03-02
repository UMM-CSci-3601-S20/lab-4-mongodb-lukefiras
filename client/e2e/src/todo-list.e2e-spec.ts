import {TodoPage} from './todo-list.po';
import {browser, protractor, by, element} from 'protractor';

describe('Todo list', () => {
  let page: TodoPage;
  const EC = protractor.ExpectedConditions;

  beforeEach(() => {
    page = new TodoPage();
    page.navigateTo();
  });

  it('Should have the correct title', () => {
    expect(page.getTodoTitle()).toEqual('Todos');
  });

  it('Should type something in the owner filter and check that it returned correct elements', async () => {
    await page.typeInput('todo-owner-input', 'Barry');

    // All of the todo cards should have the name we are filtering by
    page.getTodos().each(e => {
      expect(e.element(by.className('todo-list-owner')).getText()).toEqual('Barry');
    });
  });

  it('Should type something in the company filter and check that it returned correct elements', async () => {
    await page.typeInput('todo-company-input', 'OHMNET');

    // All of the todo cards should have the company we are filtering by
    page.getTodoCards().each(e => {
      expect(e.element(by.className('todo-card-company')).getText()).toEqual('OHMNET');
    });
  });

  it('Should type something partial in the company filter and check that it returned correct elements', async () => {
    await page.typeInput('todo-company-input', 'ti');

    // Go through each of the cards that are being shown and get the companies
    const companies = await page.getTodoCards().map(e => e.element(by.className('todo-card-company')).getText());

    // We should see these companies
    expect(companies).toContain('MOMENTIA');
    expect(companies).toContain('KINETICUT');

    // We shouldn't see these companies
    expect(companies).not.toContain('DATAGENE');
    expect(companies).not.toContain('OHMNET');
  });

  it('Should type something in the age filter and check that it returned correct elements', async () => {
    await page.typeInput('todo-age-input', '27');

    // Go through each of the cards that are being shown and get the names
    const names = await page.getTodoCards().map(e => e.element(by.className('todo-card-name')).getText());

    // We should see these todos whose age is 27
    expect(names).toContain('Stokes Clayton');
    expect(names).toContain('Bolton Monroe');
    expect(names).toContain('Merrill Parker');

    // We shouldn't see these todos
    expect(names).not.toContain('Connie Stewart');
    expect(names).not.toContain('Lynn Ferguson');
  });

  it('Should change the view', async () => {
    await page.changeView('list');

    expect(page.getTodoCards().count()).toEqual(0); // There should be no cards
    expect(page.getTodoListItems().count()).toBeGreaterThan(0); // There should be list items
  });

  it('Should select a role, switch the view, and check that it returned correct elements', async () => {
    await page.selectMatSelectValue('todo-role-select', 'viewer');
    await page.changeView('list');

    expect(page.getTodoListItems().count()).toBeGreaterThan(0);

    // All of the todo list items should have the role we are looking for
    page.getTodoListItems().each(e => {
      expect(e.element(by.className('todo-list-role')).getText()).toEqual('viewer');
    });


  });

  it('Should click view profile on a todo and go to the right URL', async () => {
    const firstTodoName = await page.getTodoCards().first().element(by.className('todo-card-name')).getText();
    const firstTodoCompany = await page.getTodoCards().first().element(by.className('todo-card-company')).getText();
    await page.clickViewProfile(page.getTodoCards().first());

    // Wait until the URL contains 'todos/' (note the ending slash)
    await browser.wait(EC.urlContains('todos/'), 10000);

    // When the view profile button on the first todo card is clicked, the URL should have a valid mongo ID
    const url = await page.getUrl();
    expect(RegExp('.*\/todos\/[0-9a-fA-F]{24}$', 'i').test(url)).toBe(true);

    // On this profile page we were sent to, the name and company should be correct
    expect(element(by.className('todo-card-name')).getText()).toEqual(firstTodoName);
    expect(element(by.className('todo-card-company')).getText()).toEqual(firstTodoCompany);
  });

  it('Should click add todo and go to the right URL', async () => {
    await page.clickAddTodoFAB();

    // Wait until the URL contains 'todos/new'
    await browser.wait(EC.urlContains('todos/new'), 10000);

    // When the view profile button on the first todo card is clicked, we should be sent to the right URL
    const url = await page.getUrl();
    expect(url.endsWith('/todos/new')).toBe(true);

    // On this profile page we were sent to, We should see the right title
    expect(element(by.className('add-todo-title')).getText()).toEqual('New Todo');
  });

});
