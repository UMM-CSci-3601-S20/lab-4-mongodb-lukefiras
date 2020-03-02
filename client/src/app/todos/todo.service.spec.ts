import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Todo } from './todo';
import { TodoService } from './todo.service';

describe('Todo service: ', () => {
  // A small collection of test todos
  const testTodos: Todo[] = [
    {
      _id: 'chris_id',
      owner: 'Chris',
      status: true,
      body: 'This is the first test todo',
      category: 'history',
    },
    {
      _id: 'pat_id',
      owner: 'Pat',
      status: false,
      body: 'This is the second test todo',
      category: 'math',
    },
    {
      _id: 'jamie_id',
      owner: 'Jamie',
      status: true,
      body: 'This is the third test todo',
      category: 'history',
    },
    {
      _id: 'mark_id',
      owner: 'Mark',
      status: true,
      body: 'This todo also has first',
      category: 'history',
    }
  ];
  let todoService: TodoService;
  // These are used to mock the HTTP requests so that we (a) don't have to
  // have the server running and (b) we can check exactly which HTTP
  // requests were made to ensure that we're making the correct requests.
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    // Set up the mock handling of the HTTP requests
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    // Construct an instance of the service with the mock
    // HTTP client.
    todoService = new TodoService(httpClient);
  });

  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    httpTestingController.verify();
  });

  it('getTodos() calls api/todos', () => {
    // Assert that the todos we get from this call to getTodos()
    // should be our set of test todos. Because we're subscribing
    // to the result of getTodos(), this won't actually get
    // checked until the mocked HTTP request 'returns' a response.
    // This happens when we call req.flush(testTodos) a few lines
    // down.
    todoService.getTodos().subscribe(
      todos => expect(todos).toBe(testTodos)
    );

    // Specify that (exactly) one request will be made to the specified URL.
    const req = httpTestingController.expectOne(todoService.todoUrl);
    // Check that the request made to that URL was a GET request.
    expect(req.request.method).toEqual('GET');
    // Specify the content of the response to that request. This
    // triggers the subscribe above, which leads to that check
    // actually being performed.
    req.flush(testTodos);
  });

  it('getTodos() calls api/todos with filter parameter \'owner\'', () => {

    todoService.getTodos({ owner: 'Blanche' }).subscribe(
      todos => expect(todos).toBe(testTodos)
    );

    // Specify that (exactly) one request will be made to the specified URL with the owner parameter.
    const req = httpTestingController.expectOne(
      (request) => request.url.startsWith(todoService.todoUrl) && request.params.has('owner')
    );

    // Check that the request made to that URL was a GET request.
    expect(req.request.method).toEqual('GET');

    // Check that the role parameter was 'admin'
    expect(req.request.params.get('owner')).toEqual('Blanche');

    req.flush(testTodos);
  });

  it('getTodoById() calls api/todos/id', () => {
    const targetTodo: Todo = testTodos[1];
    const targetId: string = targetTodo._id;
    todoService.getTodoById(targetId).subscribe(
      todo => expect(todo).toBe(targetTodo)
    );

    const expectedUrl: string = todoService.todoUrl + '/' + targetId;
    const req = httpTestingController.expectOne(expectedUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(targetTodo);
  });

  it('filterTodos() filters by category', () => {
    expect(testTodos.length).toBe(4);
    const todoCategory = 'math';
    expect(todoService.filterTodos(testTodos, { category: todoCategory }).length).toBe(1);
  });

  it('filterTodos() filters by body', () => {
    expect(testTodos.length).toBe(4);
    const todoBody = 'This';
    expect(todoService.filterTodos(testTodos, { body: todoBody }).length).toBe(4);
  });

  it('filterTodos() filters by status', () => {
    expect(testTodos.length).toBe(4);
    const todoStatus = false;
    expect(todoService.filterTodos(testTodos, { status: todoStatus }).length).toBe(4);
  });

  it('filterTodos() filters by category and body', () => {
    expect(testTodos.length).toBe(4);
    const todoCategory = 'history';
    const todoBody = 'first';
    expect(todoService.filterTodos(testTodos, { category: todoCategory, body: todoBody }).length).toBe(2);
  });

  it('filterTodos() filters by body and status', () => {
    expect(testTodos.length).toBe(4);
    const todoBody = 'This';
    const todoStatus = true;
    expect(todoService.filterTodos(testTodos, { body: todoBody, status: todoStatus }).length).toBe(3);
  });

  it('addTodo() calls api/todos/new', () => {

    todoService.addTodo(testTodos[1]).subscribe(
      id => expect(id).toBe('testid')
    );

    const req = httpTestingController.expectOne(todoService.todoUrl + '/new');

    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(testTodos[1]);

    req.flush({id: 'testid'});
  });
});
