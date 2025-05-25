package net.engineeringdigest.journalApp.service;

import lombok.extern.slf4j.Slf4j;
import net.engineeringdigest.journalApp.entity.User;
import net.engineeringdigest.journalApp.repository.UserRepository;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

//controller--> service --> repository
@Component
@Slf4j
public class UserService {
    @Autowired
    private UserRepository userRepository;

//    //whenever you use logger always use private static final
//    private static final Logger logger= LoggerFactory.getLogger(UserService.class);

    private static final PasswordEncoder passwordEncoder=new BCryptPasswordEncoder();
    //here journalEntryRepository includes methods to save the data
    //which includes the methods of MongoDB and journalEntry have the data which will implement that method
    //like id ,title , content and all
    //and journalEntry is pointting to JournalEntry file
    //and journalEntryRepository is pointing towards JournalEntryRepository
    public boolean saveNewEntry(User user){
        try {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setRoles(Arrays.asList("USER"));
            userRepository.save(user);
            return true;
        }catch (Exception e){
            log.error("yoyoyoyoyo");
              log.warn("yoyoyoyoyo");
            log.info("yoyoyoyoyo");
            log.debug("yoyoyoyoyo");
            log.trace("yoyoyoyoyo");
            return false;
        }
    }

    public void saveAdmin(User user){
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(Arrays.asList("USER","ADMIN"));
        userRepository.save(user);
    }
    public void saveUser(User user){
        userRepository.save(user);
    }

    public List<User> getAll(){
        return userRepository.findAll();
    }

    public Optional<User> findById(ObjectId id){
        return userRepository.findById(id);
    }
    public void deleteById(ObjectId id){
         userRepository.deleteById(id);
    }

    public User findByUserName(String username){
        return userRepository.findByUsername(username);
    }
}
