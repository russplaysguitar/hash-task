todo-tent
=========

A social task management system built on Tent.io. Utilizes existing status update conventions to define an API for which to manage tasks from within a social networking environment. 

### The API

#### Basic Usage:

Open an issue: `The spaceship is broken #!4321 #opened`  
Assign an issue: `@joe can you fix it? #!4321 #assigned`  
Make a comment: `This thing is really messed up #!4321`  
Assign a label via hash-tag: `This is definitely an #engine problem`  
Close an issue: `it's finally fixed. let's fly. #!4321 #closed`  

#### The 3 Commands:

##### #open

Required:  

1. #!task_id
2. Title 

Optional: 
- 

##### #assign

Required:  

1. #!task_id
2. @user

##### #close

Required:  

1. #!task_id
