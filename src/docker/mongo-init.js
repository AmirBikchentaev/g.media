// создаём прикладного пользователя для tasksdb
db = db.getSiblingDB('tasksdb');

db.createUser({
  user: 'familygames1985_db_user',
  pwd: 'OWYLnUOtW2q7XZTR',
  roles: [
    { role: 'readWrite', db: 'tasksdb' }
  ],
});
