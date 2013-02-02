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

(synonym: opened)

Required:  

1. #!task_id
2. Title 

Optional: 

- @user
- #label

##### #assign

(synonym: assigned)

Required:  

1. #!task_id
2. @user

Optional:

- comment
- #label

##### #close

(synonym: closed)

Required:  

1. #!task_id

Optional:

- @user
- #label

#### Task ID Requirements

Task IDs begin with #! and can contain letters, numbers, and/or underscores. In regex terms: [A-Za-z0-9_]+

### API Client Specifications

- The client application should only track issues which are discussed by people who the user follows (followees). 
- Issue commands by followees are always accepted.
- The most recent issue status (open, assign, or close) is the current issue status.
- New issue labels (non-command hash-tags) by followees are always accepted. 
- Comments by anyone referencing the issue (via ID) are added to the issue history.

### Social Networking System Requirements

- The entire status update history for all users must be available. This is necessary to track issue history.

