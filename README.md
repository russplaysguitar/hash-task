hash-task
=========

A collaborative issue tracking system built on Tent.io status updates. Utilizes hash-tags to define a human-readable syntax for which to manage tasks from within a social networking environment. 

### Architecture

Tasks are managed by updating their status (#open, #assigned, or #closed) and making comments about them on a Tent.io network.  
The client application is a layer of abstraction on top of this. Task activity streams can be viewed from within the application, and task changes from within the application result in posts on the Tent network.  
See the [client application mock-ups](https://moqups.com/moqupsruss/XQGInmsT/p:a3907ed67).

##### Benefits

- Issue tracking in an open, social environment.
- Simple syntax built on the existing standard for topic discussion: hash-tags.
- Tent users can interact with the task management system without using the client application.
- Third-party developers can create new applications that use the same task management syntax.

### The Social API

#### Basic Usage

Open a task: `The warp-drive is not working #enterprise/4321 #open`  
Assign an task: `@geordi can you fix this? #enterprise/4321 #assign`  
Make a comment: `Fix in progress... #enterprise/4321`  
Assign a label via hash-tag: `It seems to be a problem with #antimatter #enterprise/4321`  
Close an task: `Warp-drive is back online. Engage. #enterprise/4321 #close`  

#### Short-hand syntax for personal tasks

Tasks which are intended only for the user who opens them can use a short-hand syntax: `#/task_name`

Tasks created using this syntax will automatically be opened and assigned to the user who posts it with the project name being that user's name.

For example, a status update from Joe: `#/groceries Need to buy food on Tues` results in a new project named `Joe` and a new task named `groceries` which has been assigned to Joe. 

### API Client Specifications

- The client application should only track issues which are discussed by people who the user follows (followees). 
- Commands by followees are always accepted.
- The most recent task status (open, assign, or close) is the current status of that task.
- New issue labels (non-command hash-tags) by followees are always accepted. 
- Comments by anyone referencing the issue (via ID) are added to the issue history.

#### The 3 Commands:

##### #open

(synonym: opened)

Required:  

1. #project_name/task_id
2. Title 

Optional: 

- @user
- #label

##### #assign

(synonym: assigned)

Required:  

1. #project_name/task_id
2. @user

Optional:

- comment
- #label

##### #close

(synonym: closed)

Required:  

1. #project_name/task_id

Optional:

- @user
- #label

#### Task "properties"

- Task comments can also include properties. For instance, a due date property may be assigned like so: `This needs fixed quickly! due:1/31/13 #enterprise/4321`
- Properties are arbitrary. 
- Properties can contain any non-whitespace characters.

#### Unique ID specifications

- All 3 commands must include a project name and a task id in this format: `#project_name/task_id`. These two pieces together are what make up a unique ID for each task. Project names and task ids can consist of letters, numbers, and/or underscores. IDs cannot be considered to be globally unique, but should be sufficiently unique amongst a group. 

### Social Networking System Requirements

- The entire status update history for all users must be available and searchable. This is necessary to track issue history.
