import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Todo } from './todo';
import { TodoService } from './todo.service';

@Component({
  selector: 'app-add-todo',
  templateUrl: './add-todo.component.html',
  styleUrls: ['./add-todo.component.scss']
})
export class AddTodoComponent implements OnInit {

  addTodoForm: FormGroup;

  todo: Todo;

  constructor(private fb: FormBuilder, private todoService: TodoService, private snackBar: MatSnackBar, private router: Router) {
  }

  // not sure if this name is magical and making it be found or if I'm missing something,
  // but this is where the red text that shows up (when there is invalid input) comes from
  add_todo_validation_messages = {
    owner: [
      {type: 'required', message: 'Owner is required'},
      {type: 'minlength', message: 'Owner must be at least 2 characters long'},
      {type: 'maxlength', message: 'Owner cannot be more than 50 characters long'},
      {type: 'pattern', message: 'Owner must contain only numbers and letters'},
    ],

    status: [
      {type: 'required', message: 'Status is required'}
    ],

    body: [
      {type: 'required', message: 'Body is required'}
    ],

    category: [
      {type: 'required', message: 'Category is required' }
    ]
  };

  createForms() {

    // add todo form validations
    this.addTodoForm = this.fb.group({
      // We allow alphanumeric input and limit the length for name.
      owner: new FormControl('', Validators.compose([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern('^[A-Za-z0-9\\s]+[A-Za-z0-9\\s]+$(\\.0-9+)?'),
      ])),

      status: new FormControl('', Validators.compose([
        Validators.required,
      ])),

      body: new FormControl('', Validators.compose([
        Validators.required,
      ])),

      category: new FormControl('', Validators.compose([
        Validators.required,
      ]))

    });

  }

  ngOnInit() {
    this.createForms();
  }


  submitForm() {
    this.todoService.addTodo(this.addTodoForm.value).subscribe(newID => {
      this.snackBar.open('Added Todo ' + this.addTodoForm.value.name, null, {
        duration: 2000,
      });
      this.router.navigate(['/todos/', newID]);
    }, err => {
      this.snackBar.open('Failed to add the todo', null, {
        duration: 2000,
      });
    });
  }

}
