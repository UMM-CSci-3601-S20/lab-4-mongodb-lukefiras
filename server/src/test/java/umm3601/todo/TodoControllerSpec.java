package umm3601.todo;

import static com.mongodb.client.model.Filters.eq;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.ImmutableMap;
import com.mockrunner.mock.web.MockHttpServletRequest;
import com.mockrunner.mock.web.MockHttpServletResponse;
import com.mongodb.BasicDBObject;
import com.mongodb.MongoClientSettings;
import com.mongodb.ServerAddress;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import io.javalin.http.BadRequestResponse;
import io.javalin.http.Context;
import io.javalin.http.NotFoundResponse;
import io.javalin.http.util.ContextUtil;
import io.javalin.plugin.json.JavalinJson;


/**
* Tests the logic of the TodoController
*
* @throws IOException
*/
public class TodoControllerSpec {

  MockHttpServletRequest mockReq = new MockHttpServletRequest();
  MockHttpServletResponse mockRes = new MockHttpServletResponse();

  private TodoController todoController;

  private ObjectId jakesId;

  static MongoClient mongoClient;
  static MongoDatabase db;

  static ObjectMapper jsonMapper = new ObjectMapper();

  @BeforeAll
  public static void setupAll() {
    String mongoAddr = System.getenv().getOrDefault("MONGO_ADDR", "localhost");

    mongoClient = MongoClients.create(
    MongoClientSettings.builder()
    .applyToClusterSettings(builder ->
    builder.hosts(Arrays.asList(new ServerAddress(mongoAddr))))
    .build());

    db = mongoClient.getDatabase("test");
  }


  @BeforeEach
  public void setupEach() throws IOException {

    // Reset our mock request and response objects
    mockReq.resetAll();
    mockRes.resetAll();

    // Setup database
    MongoCollection<Document> todoDocuments = db.getCollection("todos");
    todoDocuments.drop();
    List<Document> testTodos = new ArrayList<>();
    testTodos.add(Document.parse("{\n" +
    "                    owner: \"Chris\",\n" +
    "                    status: true,\n" +
    "                    body: \"This is the first test todo\",\n" +
    "                    category: \"history\",\n" +
    "                }"));
    testTodos.add(Document.parse("{\n" +
    "                    owner: \"Pat\",\n" +
    "                    status: false,\n" +
    "                    body: \"This is the second test todo\",\n" +
    "                    category: \"math\",\n" +
    "                }"));
    testTodos.add(Document.parse("{\n" +
    "                    owner: \"Jamie\",\n" +
    "                    status: true,\n" +
    "                    body: \"This is the third test todo\",\n" +
    "                    category: \"history\",\n" +
    "                }"));
    testTodos.add(Document.parse("{\n" +
    "                    owner: \"Mark\",\n" +
    "                    status: true,\n" +
    "                    body: \"This todo also has first\",\n" +
    "                    category: \"history\",\n" +
    "                }"));

    jakesId = new ObjectId();
    BasicDBObject jake = new BasicDBObject("_id", jakesId);
    jake = jake.append("owner", "Jake")
      .append("status", true)
      .append("body", "Testing")
      .append("category", "science");


    todoDocuments.insertMany(testTodos);
    todoDocuments.insertOne(Document.parse(jake.toJson()));

    todoController = new TodoController(db);
  }

  @AfterAll
  public static void teardown() {
    db.drop();
    mongoClient.close();
  }

  @Test
  public void GetAllTodos() throws IOException {

    // Create our fake Javalin context
    Context ctx = ContextUtil.init(mockReq, mockRes, "api/todos");
    todoController.getTodos(ctx);


    assertEquals(200, mockRes.getStatus());

    String result = ctx.resultString();
    assertEquals(db.getCollection("todos").countDocuments(), JavalinJson.fromJson(result, Todo[].class).length);
  }

  /**
  * Test that if the todo sends a request with an illegal value in
  * the status field (i.e., something that can't be parsed to a boolean)
  * we get a reasonable error code back.
  */
  /* @Test
  public void GetTodosWithIllegalStatus() {

    mockReq.setQueryString("status=abc");
    Context ctx = ContextUtil.init(mockReq, mockRes, "api/todos");

    // This should now throw a `BadRequestResponse` exception because
    // our request has a status that can't be parsed to a boolean.
    assertThrows(BadRequestResponse.class, () -> {
      todoController.getTodos(ctx);
    });
  } */

  @Test
  public void GetTodosByOwner() throws IOException {

    mockReq.setQueryString("owner=p");
    Context ctx = ContextUtil.init(mockReq, mockRes, "api/todos");
    todoController.getTodos(ctx);

    assertEquals(200, mockRes.getStatus());
    String result = ctx.resultString();
    for (Todo todo : JavalinJson.fromJson(result, Todo[].class)) {
      assertEquals("Pat", todo.owner);
    }
  }

  @Test
  public void GetTodoWithExistentId() throws IOException {

    String testID = jakesId.toHexString();

    Context ctx = ContextUtil.init(mockReq, mockRes, "api/todos/:id", ImmutableMap.of("id", testID));
    todoController.getTodo(ctx);

    assertEquals(200, mockRes.getStatus());

    String result = ctx.resultString();
    Todo resultTodo = JavalinJson.fromJson(result, Todo.class);

    assertEquals(resultTodo._id, jakesId.toHexString());
    assertEquals(resultTodo.owner, "Jake");
  }

  @Test
  public void GetTodoWithBadId() throws IOException {

    Context ctx = ContextUtil.init(mockReq, mockRes, "api/todos/:id", ImmutableMap.of("id", "bad"));

    assertThrows(BadRequestResponse.class, () -> {
      todoController.getTodo(ctx);
    });
  }

  @Test
  public void GetTodoWithNonexistentId() throws IOException {

    Context ctx = ContextUtil.init(mockReq, mockRes, "api/todos/:id", ImmutableMap.of("id", "58af3a600343927e48e87335"));

    assertThrows(NotFoundResponse.class, () -> {
      todoController.getTodo(ctx);
    });
  }

  @Test
  public void AddTodo() throws IOException {

    String testNewTodo = "{\n\t\"owner\": \"Test Todo\",\n\t\"status\":true,\n\t\"body\": \"this\",\n\t\"category\": \"history\"}";

    mockReq.setBodyContent(testNewTodo);
    mockReq.setMethod("POST");

    Context ctx = ContextUtil.init(mockReq, mockRes, "api/todos/new");

    todoController.addNewTodo(ctx);

    assertEquals(201, mockRes.getStatus());

    String result = ctx.resultString();
    String id = jsonMapper.readValue(result, ObjectNode.class).get("id").asText();
    assertNotEquals("", id);
    System.out.println(id);

    assertEquals(1, db.getCollection("todos").countDocuments(eq("_id", new ObjectId(id))));

    //verify todo was added to the database and the correct ID
    Document addedTodo = db.getCollection("todos").find(eq("_id", new ObjectId(id))).first();
    assertNotNull(addedTodo);
    assertEquals("Test Todo", addedTodo.getString("owner"));
    assertEquals(true, addedTodo.getBoolean("status"));
    assertEquals("this", addedTodo.getString("body"));
    assertEquals("history", addedTodo.getString("category"));
  }

  @Test
  public void AddInvalidStatusTodo() throws IOException {
    String testNewTodo = "{\n\t\"name\": \"Test Todo\",\n\t\"status\":\"notaboolean\",\n\t\"body\": \"this\",\n\t\"category\": \"history\"\n}";
    mockReq.setBodyContent(testNewTodo);
    mockReq.setMethod("POST");
    Context ctx = ContextUtil.init(mockReq, mockRes, "api/todos/new");

    assertThrows(BadRequestResponse.class, () -> {
      todoController.addNewTodo(ctx);
    });
  }

  @Test
  public void AddInvalidOwnerTodo() throws IOException {
    String testNewTodo = "{\n\t\"status\":true,\n\t\"body\": \"this\",\n\t\"category\": \"history\"\n}";
    mockReq.setBodyContent(testNewTodo);
    mockReq.setMethod("POST");
    Context ctx = ContextUtil.init(mockReq, mockRes, "api/todos/new");

    assertThrows(BadRequestResponse.class, () -> {
      todoController.addNewTodo(ctx);
    });
  }

  @Test
  public void AddInvalidCategoryTodo() throws IOException {
    String testNewTodo = "{\n\t\"name\": \"Test Todo\",\n\t\"status\":true,\n\t\"body\": \"this\",\n\t\"category\": \"invalidcategory\"\n}";
    mockReq.setBodyContent(testNewTodo);
    mockReq.setMethod("POST");
    Context ctx = ContextUtil.init(mockReq, mockRes, "api/todos/new");

    assertThrows(BadRequestResponse.class, () -> {
      todoController.addNewTodo(ctx);
    });
  }

  @Test
  public void DeleteTodo() throws IOException {

    String testID = jakesId.toHexString();

    // Todo exists before deletion
    assertEquals(1, db.getCollection("todos").countDocuments(eq("_id", new ObjectId(testID))));

    Context ctx = ContextUtil.init(mockReq, mockRes, "api/todos/:id", ImmutableMap.of("id", testID));
    todoController.deleteTodo(ctx);

    assertEquals(200, mockRes.getStatus());

    // Todo is no longer in the database
    assertEquals(0, db.getCollection("todos").countDocuments(eq("_id", new ObjectId(testID))));
  }

}
