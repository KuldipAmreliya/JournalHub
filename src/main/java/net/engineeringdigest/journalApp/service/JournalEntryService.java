package net.engineeringdigest.journalApp.service;

import net.engineeringdigest.journalApp.entity.JournalEntry;
import net.engineeringdigest.journalApp.entity.User;
import net.engineeringdigest.journalApp.repository.JournalEntryRepository;
import org.bson.types.ObjectId;
import org.slf4j.ILoggerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

//controller--> service-->entity --> repository
@Component
public class JournalEntryService {
    @Autowired
    private JournalEntryRepository journalEntryRepository;
    @Autowired
    private UserService userService;
    private static final Logger log = LoggerFactory.getLogger(JournalEntryService.class);

    //here journalEntryRepository includes methods to save the data
    //which includes the methods of MongoDB and journalEntry have the data which will implement that method
    //like id ,title , content and all
    //and journalEntry is pointting to JournalEntry file
    //and journalEntryRepository is pointing towards JournalEntryRepository
    @Transactional
    public void saveEntry(JournalEntry journalEntry, String userName){
        try {
            User user=userService.findByUserName(userName);
            journalEntry.setDate(LocalDateTime.now());
            JournalEntry saved= journalEntryRepository.save(journalEntry);
            user.getJournalEntries().add(saved);    
            userService.saveUser(user);
        }
        catch (Exception e){
            throw new RuntimeException("an error occured while saving the entity.",e);
        }
    }

    public void saveEntry(JournalEntry journalEntry){
        journalEntryRepository.save(journalEntry);
    }


    public List<JournalEntry> getAll(){
        return journalEntryRepository.findAll();
    }

    public Optional<JournalEntry> findById(ObjectId id){
        return journalEntryRepository.findById(id);
    }
    @Transactional
    public boolean deleteById(ObjectId id, String userName) {
        try {
            log.info("Attempting to delete journal entry with ID: {} for user: {}", id, userName);
            
            User user = userService.findByUserName(userName);
            if (user == null) {
                log.error("User not found: {}", userName);
                return false;
            }
            
            log.info("User found: {}", userName);
            log.info("User has {} journal entries", user.getJournalEntries().size());

            // First check if the entry exists and belongs to the user
            boolean entryExists = user.getJournalEntries().stream()
                .anyMatch(entry -> entry.getId().equals(id));

            if (!entryExists) {
                log.error("Journal entry with ID {} not found in user's entries", id);
                return false;
            }
            
            log.info("Journal entry found in user's entries");

            // Remove from user's journal entries
            int beforeSize = user.getJournalEntries().size();
            user.getJournalEntries().removeIf(entry -> entry.getId().equals(id));
            int afterSize = user.getJournalEntries().size();
            
            if (beforeSize == afterSize) {
                log.error("Failed to remove entry from user's journal entries");
                return false;
            }
            
            log.info("Entry removed from user's journal entries");
            userService.saveUser(user);
            log.info("User saved after removing entry");

            // Delete from repository
            try {
                journalEntryRepository.deleteById(id);
                log.info("Entry deleted from repository");
                return true;
            } catch (Exception e) {
                log.error("Error deleting from repository: {}", e.getMessage());
                return false;
            }
        } catch (Exception e) {
            log.error("Error deleting journal entry: {}", e.getMessage(), e);
            return false;
        }
    }


}
