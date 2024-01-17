// console.log("Its Working")
const todoArray= JSON.parse(todos)
// console.log(todos);
// console.log("todoArray:", todoArray);
document.addEventListener('click', function(event){
   if( event.target.classList.contains('edit-me')){
        const newTodo= prompt("Enter New Todo");
        const id= event.target.getAttribute("data-id");
        axios.post('/edit-item',{id, newTodo})
        .then((res)=>{
            console.log(res);
            if (res.data.status !== 200) {
                alert(res.data.message);
              }
      
              event.target.parentElement.parentElement.querySelector(
                ".item-text"
              ).innerHTML = newTodo;
      
              return;
            })
            .catch((err) => {
              console.log(err);
              alert(err.message);
            });
       }

    else if(event.target.classList.contains('delete-me')){
    
    const id= event.target.getAttribute("data-id");
    axios.post('/delete-item',{id})
    .then((res)=>{
        // console.log(res);
        if (res.data.status !== 200) {
            alert("Do you want to delete this item?");
            console.log(res);
          }
  
          event.target.parentElement.parentElement.remove();
  
          return;
        })
        .catch((err) => {
          console.log(err);
          alert(err.message);
        });
}

})
document.getElementById("item_list").insertAdjacentHTML(
  "beforeend",
  todoArray
    .map((item) => {
      // console.log(item);
      return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
    <span class="item-text"> ${item.todo} </span>
    <div>
    <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
    <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
</div>
</li>`;
    })
    .join("")
);