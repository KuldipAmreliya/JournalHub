package net.engineeringdigest.journalApp.repository;

import net.engineeringdigest.journalApp.entity.JournalEntry;
import net.engineeringdigest.journalApp.entity.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
//here you have to write name of entity and object id
public interface UserRepository extends MongoRepository<User, ObjectId> {

    User findByUsername(String username);
    default void deleteByUserName(String username){

    };
}
