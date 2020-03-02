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

    // All of the todo list items should have the name we are filtering by
    page.getTodoListItems().each(e => {
      expect(e.element(by.className('todo-list-owner')).getText()).toEqual('Barry');
    });
  });

  it('Should type something in the body filter and check that it returned correct elements', async () => {
    await page.typeInput('todo-body-input', 'sunt');

    // All of the todo list items should have the body we are filtering by
    page.getTodoListItems().each(e => {
      expect(e.element(by.className('todo-list-body')).getText()).toEqual('sunt');
    });
  });

  it('Should click add todo and go to the right URL', async () => {
    await page.clickAddTodoFAB();

    // Wait until the URL contains 'todos/new'
    await browser.wait(EC.urlContains('todos/new'), 10000);

    // When the view profile button on the first todo list item is clicked, we should be sent to the right URL
    const url = await page.getUrl();
    expect(url.endsWith('/todos/new')).toBe(true);

    // On this profile page we were sent to, We should see the right title
    expect(element(by.className('add-todo-title')).getText()).toEqual('New Todo');
  });

});
