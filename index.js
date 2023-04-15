//console.log("hello world")

/* 
  client side
    template: static template
    logic(js): MVC(model, view, controller): used to server side technology, single page application
        model: prepare/manage data,
        view: manage view(DOM),
        controller: business logic, event bindind/handling

  server side
    json-server
    CRUD: create(post), read(get), update(put, patch), delete(delete)


*/

//read
/* fetch("http://localhost:3000/todos")
    .then((res) => res.json())
    .then((data) => {
        console.log(data);
    }); */

function myFetch(url, options = {}) {
  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method || "GET", url);
    xhr.responseType = "json";
    for (let headerName in options.headers) {
      xhr.setRequestHeader(headerName, options.headers[headerName]);
    }
    xhr.onload = () => {
      res(xhr.response);
    };
    xhr.onerror = () => {
      rej(new Error("fetch failed"));
    };
    xhr.send(options.body);
  });
}
const APIs = (() => {
    const createTodo = (newTodo) => {
        return myFetch("http://localhost:3000/todos", {
            method: "POST",
            body: JSON.stringify(newTodo),
            headers: { "Content-Type": "application/json" },
        });
    };

    const deleteTodo = (id) => {
        return myFetch("http://localhost:3000/todos/" + id, {
            method: "DELETE",
        });
    };

    const updateTodo = (id, newTodo) => {
        return myFetch("http://localhost:3000/todos/" + id, {
          method: "PATCH",
          body: JSON.stringify(newTodo),
          headers: { "Content-Type": "application/json" },
        });
      };

    const getTodos = () => {
        return myFetch("http://localhost:3000/todos");
    };
    return { createTodo, deleteTodo, updateTodo, getTodos };
})();

//IIFE
//todos
/* 
    hashMap: faster to search
    array: easier to iterate, has order


*/
const Model = (() => {
    class State {
        #todos; //private field
        #onChange; //function, will be called when setter function todos is called
        constructor() {
            this.#todos = [];
        }
        get todos() {
            return this.#todos;
        }
        set todos(newTodos) {
            // reassign value
            console.log("setter function");
            this.#todos = newTodos;
            this.#onChange?.(); // rendering
        }

        subscribe(callback) {
            //subscribe to the change of the state todos
            this.#onChange = callback;
        }
    }
    const { getTodos, createTodo, deleteTodo, updateTodo } = APIs;
    return {
      State,
      getTodos,
      createTodo,
      deleteTodo,
      updateTodo,
    };
})();
/* 
    todos = [
        {
            id:1,
            content:"eat lunch"
        },
        {
            id:2,
            content:"eat breakfast"
        }
    ]

*/
const View = (() => {
    const todolistEl = document.querySelector(".todo-list--pending");
    const todolistcompletedEl = document.querySelector(".todo-list--completed");
    const submitBtnEl = document.querySelector(".submit-btn");
    const inputEl = document.querySelector(".input");


    const renderTodos = (todos) => {
        let todosTemplate = "";
        let todoscompleteTemplate = "";

        const todospending = todos.filter((todo) => {
            return !todo.complete;
        });
        const todoscompleted = todos.filter((todo) => {
            return todo.complete;
        });

        todospending.forEach((todo) => {
            const liTemplate = `<li><span>${todo.content}</span><button class="edit-btn" id="edit-btn/${todo.id}">edit</button><button class="delete-btn" id="${todo.id}">delete</button><button class="move-btn" id="move-btn/${todo.id}">move</button></li>`;
            todosTemplate += liTemplate;
        });
        todoscompleted.forEach((todo) => {
            const liTemplate = `<li><span>${todo.content}</span><button class="edit-btn" id="edit-btn/${todo.id}">edit</button><button class="delete-btn" id="${todo.id}">delete</button><button class="move-btn" id="move-btn/${todo.id}">move</button></li>`;
            todoscompleteTemplate += liTemplate;
        });
        
        if (todospending.length === 0) {
            todosTemplate = "<h4>no pending task!</h4>";
        }
        if (todoscompleted.length === 0) {
            todoscompleteTemplate = "<h4>no completed task!</h4>";
        }
        todolistEl.innerHTML = todosTemplate;
        todolistcompletedEl.innerHTML = todoscompleteTemplate;
    };

    const clearInput = () => {
        inputEl.value = "";
    };

    return { renderTodos, submitBtnEl, inputEl, clearInput, todolistEl, todolistcompletedEl };
})();

const Controller = ((view, model) => {
    const state = new model.State();
    const init = () => {
        model.getTodos().then((todos) => {
            todos.reverse();
            state.todos = todos;
        });
    };

    const handleSubmit = () => {
        view.submitBtnEl.addEventListener("click", (event) => {
            /* 
                1. read the value from input
                2. post request
                3. update view
            */
            const inputValue = view.inputEl.value;
            model.createTodo({ content: inputValue, complete: false }).then((data) => {
                state.todos = [data, ...state.todos];
                view.clearInput();
            });
        });
    };

    const handleMove = () => {
        view.todolistEl.addEventListener("click", (event) => {
            if (event.target.className === "move-btn") {
              const id = event.target.id.split("/")[1];
              model.updateTodo(+id, { complete: true }).then(() => {
                state.todos.forEach((todo) => {
                  if (+todo.id === +id) {
                    todo.complete = true;
                  }
                });
                state.todos = [...state.todos];
              });
            }
          });
        view.todolistcompletedEl.addEventListener("click", (event) => {
            if (event.target.className === "move-btn") {
              const id = event.target.id.split("/")[1];
              model.updateTodo(+id, { complete: false }).then(() => {
                state.todos.forEach((todo) => {
                  if (+todo.id === +id) {
                    todo.complete = false;
                  }
                });
                state.todos = [...state.todos];
              });
            }
          });

    }

    const handleEdit = () => {
        view.todolistEl.addEventListener("click", (event) => {
          if (event.target.className === "edit-btn") {
            const id = event.target.id.split("/")[1];
            const spanEl = event.target.parentElement.firstChild;
            if (spanEl.contentEditable === "true") {
              model.updateTodo(+id, { content: spanEl.innerHTML }).then(() => {
                spanEl.contentEditable = "false";
                spanEl.style.backgroundColor = "#e6e2d3";
              });
            } else {
              spanEl.contentEditable = "true";
              spanEl.style.backgroundColor = "white";
            }
          }
        });
        view.todolistcompletedEl.addEventListener("click", (event) => {
          if (event.target.className === "edit-btn") {
            const id = event.target.id.split("/")[1];
            const spanEl = event.target.parentElement.firstChild;
            if (spanEl.contentEditable === "true") {
              model.updateTodo(+id, { content: spanEl.innerHTML }).then(() => {
                spanEl.contentEditable = "false";
                spanEl.style.backgroundColor = "#e6e2d3";
              });
            } else {
              spanEl.contentEditable = "true";
              spanEl.style.backgroundColor = "white";
            }
          }
        });
      };

    const handleDelete = () => {
        //event bubbling
        /* 
            1. get id
            2. make delete request
            3. update view, remove
        */
        view.todolistEl.addEventListener("click", (event) => {
            if (event.target.className === "delete-btn") {
                const id = event.target.id;
                console.log("id", typeof id);
                model.deleteTodo(+id).then((data) => {
                    state.todos = state.todos.filter((todo) => todo.id !== +id);
                });
            }
        });

        view.todolistcompletedEl.addEventListener("click", (event) => {
            if (event.target.className === "delete-btn") {
                const id = event.target.id;
                console.log("id", typeof id);
                model.deleteTodo(+id).then((data) => {
                    state.todos = state.todos.filter((todo) => todo.id !== +id);
                });
            }
        });
    };

    const bootstrap = () => {
        init();
        handleSubmit();
        handleDelete();
        handleMove();
        handleEdit();
        state.subscribe(() => {
            view.renderTodos(state.todos);
        });
    };
    return {
        bootstrap,
    };
})(View, Model); //ViewModel

Controller.bootstrap();
