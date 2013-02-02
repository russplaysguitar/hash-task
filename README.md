todo-tent
=========

A social task management system built on Tent.io. Utilizes existing "status update" conventions to define an API for which to manage tasks from within a social networking environment. 

### Architecture

Commands for managing tasks are sent out as "status updates" over an existing social network. These are written in a human-readable format. Client applications can be used to collect task history, determine the current issue status, and send task management commands.

### The Social API

#### Basic Usage:

Open an issue: `The warp-drive is not working #enterprise/4321 #open`  
Assign an issue: `@geordi can you fix this? #enterprise/4321 #assign`  
Make a comment: `Fix in progress... #enterprise/4321`  
Assign a label via hash-tag: `It seems to be a problem with #antimatter #enterprise/4321`  
Close an issue: `Warp-drive is back online. Engage. #enterprise/4321 #close`  

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

#### Project Name and Task ID specifications

- All 3 commands must include a project name and a task id in this format: `#project_name/task_id`. These two pieces together are what make up a unique ID for each task. Project names and task ids can consist of letters, numbers, and/or underscores. IDs cannot be considered to be globally unique, but should be sufficiently unique amongst a group. 

### Social Networking System Requirements

- The entire status update history for all users must be available. This is necessary to track issue history.
